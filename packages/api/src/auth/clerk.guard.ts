import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  UnauthorizedException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { appConfig } from '../config/app.config';
import { UserService } from '../user/user.service';
import { AuthenticatedUser } from '../common/types/auth.types';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

interface CachedUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  roles: string[];
  cachedAt: number;
}

interface CachedToken {
  userId: string;
  verifiedAt: number;
}

@Injectable()
export class ClerkGuard implements CanActivate {
  private clerk: ReturnType<typeof createClerkClient> | null = null;
  // Cache user data for 5 minutes to avoid repeated Clerk API calls
  private userCache = new Map<string, CachedUser>();
  // Cache verified tokens for 1 minute to avoid repeated verifyToken calls
  private tokenCache = new Map<string, CachedToken>();
  private readonly USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TOKEN_CACHE_TTL = 60 * 1000; // 1 minute (tokens can expire)

  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {
    if (appConfig.clerk.secretKey) {
      this.clerk = createClerkClient({
        secretKey: appConfig.clerk.secretKey,
      });
    } else {
      console.warn('CLERK_SECRET_KEY is not set. Authentication will be disabled.');
    }
    
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [userId, user] of this.userCache.entries()) {
        if (now - user.cachedAt > this.USER_CACHE_TTL) {
          this.userCache.delete(userId);
        }
      }
      for (const [token, cached] of this.tokenCache.entries()) {
        if (now - cached.verifiedAt > this.TOKEN_CACHE_TTL) {
          this.tokenCache.delete(token);
        }
      }
    }, 5 * 60 * 1000);
  }

  private getCachedUser(userId: string): CachedUser | null {
    const cached = this.userCache.get(userId);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.cachedAt > this.USER_CACHE_TTL) {
      this.userCache.delete(userId);
      return null;
    }
    
    return cached;
  }

  private setCachedUser(user: CachedUser): void {
    this.userCache.set(user.id, { ...user, cachedAt: Date.now() });
  }

  private getCachedToken(token: string): string | null {
    const cached = this.tokenCache.get(token);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.verifiedAt > this.TOKEN_CACHE_TTL) {
      this.tokenCache.delete(token);
      return null;
    }
    
    return cached.userId;
  }

  private setCachedToken(token: string, userId: string): void {
    this.tokenCache.set(token, { userId, verifiedAt: Date.now() });
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
      const token = authHeader.replace('Bearer ', '').trim();
      
      if (!token) {
        throw new UnauthorizedException('Invalid authorization token');
      }
      
      // Check if we've recently verified this token (cache for 1 minute)
      const cachedUserId = this.getCachedToken(token);
      let userId: string | null = null;
      let session: any = null;
      
      if (cachedUserId) {
        // Token was recently verified, use cached userId
        userId = cachedUserId;
      } else {
        // Verify the session token with Clerk (only if not cached)
        session = await verifyToken(token, {
          secretKey: appConfig.clerk.secretKey,
        });
        
        // Get user ID from session (JWT payload)
        userId = session.sub || (session as any).userId;
        
        if (userId) {
          // Cache the verified token
          this.setCachedToken(token, userId);
        }
      }
      
      if (!userId) {
        throw new UnauthorizedException('Invalid token: user ID not found');
      }
      
      // Check cache first to avoid repeated Clerk API calls
      let userData: CachedUser | null = this.getCachedUser(userId);
      
      if (!userData) {
        // Fetch user details from Clerk only if not cached
        try {
          const clerkUser = await this.clerk.users.getUser(userId);
          
          // Extract roles from public metadata, default to ["user"] if not present
          const publicMetadata = clerkUser.publicMetadata as any;
          const roles = publicMetadata?.roles || ['user'];
          
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
          this.setCachedUser(userData);
        } catch (userError) {
          console.error(`ClerkGuard.getUser ERROR for ${path}:`, userError);
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
        console.error(`ClerkGuard.syncUser ERROR for ${path}:`, dbError);
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
      console.error(`ClerkGuard.canActivate ERROR for ${path}:`, error);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
