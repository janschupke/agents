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
import { extractBearerToken } from '@openai/utils';
import { MAGIC_STRINGS } from '@openai/shared-types';
import { UserService } from '../src/user/user.service';
import { AuthenticatedUser } from '../src/common/types/auth.types';

const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Test guard that bypasses Clerk authentication
 * Extracts user ID from test token format: "test-token-{userId}"
 * This guard is used in integration tests to bypass Clerk verification
 */
@Injectable()
export class TestGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(forwardRef(() => UserService))
    private userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const authHeader = request.headers.authorization || request.headers.Authorization;

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

      // Extract user ID from test token format: "test-token-{userId}"
      let userId: string;
      if (token.startsWith(MAGIC_STRINGS.TEST_TOKEN_PREFIX)) {
        userId = token.replace(MAGIC_STRINGS.TEST_TOKEN_PREFIX, '');
      } else {
        // Fallback: use token as userId for backward compatibility
        userId = token;
      }

      // Ensure user exists in database (create if needed)
      const user = await this.userService.findOrCreate({
        id: userId,
        email: `test-${userId}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        roles: ['user'],
      });

      // Attach user info to request
      request.user = {
        id: user.id,
        email: user.email || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        imageUrl: user.imageUrl || null,
        roles: (user.roles as string[]) || ['user'],
      } as AuthenticatedUser;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        `Test authentication failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
