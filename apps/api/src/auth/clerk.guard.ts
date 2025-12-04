import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  UnauthorizedException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { extractBearerToken } from '@openai/utils';
import { MAGIC_STRINGS } from '@openai/shared-types';
import { UserService } from '../user/user.service';
import { AuthenticatedUser } from '../common/types/auth.types';
import { AuthCacheService, CachedUser } from './services/auth-cache.service';

const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class ClerkGuard implements CanActivate {
  private readonly logger = new Logger(ClerkGuard.name);
  private clerk: ReturnType<typeof createClerkClient> | null = null;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly authCacheService: AuthCacheService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {
    const secretKey =
      this.configService.get<string>('app.clerk.secretKey') || '';
    if (secretKey) {
      this.clerk = createClerkClient({
        secretKey,
      });
      this.logger.log('Clerk client initialized');
    } else {
      this.logger.warn(
        'CLERK_SECRET_KEY is not set. Authentication will be disabled.'
      );
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // If Clerk is not configured, allow all requests (for development)
    if (!this.clerk) {
      return true;
    }

    const authHeader = request.headers.authorization;

    // If no auth header, throw 401 for protected routes
    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    try {
      // Extract token from "Bearer <token>" format
      const token = extractBearerToken(authHeader);

      if (!token) {
        throw new UnauthorizedException('Invalid authorization token');
      }

      // Check if we've recently verified this token (cache for 1 minute)
      const cachedUserId = this.authCacheService.getCachedToken(token);
      let userId: string | null = null;
      let session: { sub?: string; userId?: string } | null = null;

      if (cachedUserId) {
        // Token was recently verified, use cached userId
        this.logger.debug('Using cached token verification');
        userId = cachedUserId;
      } else {
        // Verify the session token with Clerk (only if not cached)
        const secretKey =
          this.configService.get<string>('app.clerk.secretKey') || '';
        session = await verifyToken(token, {
          secretKey,
        });

        // Get user ID from session (JWT payload)
        userId = session.sub || session.userId || null;

        if (userId) {
          // Cache the verified token
          this.authCacheService.setCachedToken(token, userId);
          this.logger.debug(`Token verified and cached for user ${userId}`);
        }
      }

      if (!userId) {
        this.logger.warn('Invalid token: user ID not found');
        throw new UnauthorizedException('Invalid token: user ID not found');
      }

      // Check cache first to avoid repeated Clerk API calls
      let userData: CachedUser | null =
        this.authCacheService.getCachedUser(userId);

      if (!userData) {
        // Fetch user details from Clerk only if not cached
        try {
          const clerkUser = await this.clerk.users.getUser(userId);

          // Extract roles from public metadata, default to ["user"] if not present
          const publicMetadata = clerkUser.publicMetadata as
            | { roles?: string[] }
            | null
            | undefined;
          const roles = publicMetadata?.roles || [
            MAGIC_STRINGS.DEFAULT_USER_ROLE,
          ];

          userData = {
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || null,
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            imageUrl: clerkUser.imageUrl || null,
            roles,
            cachedAt: Date.now(),
          };

          // Cache the user data
          this.authCacheService.setCachedUser(userData);
        } catch (userError) {
          this.logger.error(`ClerkGuard.getUser ERROR for ${path}:`, userError);
          throw new UnauthorizedException('Failed to fetch user information');
        }
      }

      // Sync user to database (including roles)
      // This ensures the user exists in DB and roles are synced from Clerk
      try {
        await this.userService.findOrCreate({
          id: userData.id,
          email: userData.email || undefined,
          firstName: userData.firstName || undefined,
          lastName: userData.lastName || undefined,
          imageUrl: userData.imageUrl || undefined,
          roles: userData.roles,
        });
      } catch (dbError) {
        // Log but don't fail - user can still proceed
        this.logger.error(`ClerkGuard.syncUser ERROR for ${path}:`, dbError);
      }

      // Attach user info to request for use in controllers
      request.user = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        imageUrl: userData.imageUrl,
        roles: userData.roles,
      } as AuthenticatedUser;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`ClerkGuard.canActivate ERROR for ${path}:`, error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
