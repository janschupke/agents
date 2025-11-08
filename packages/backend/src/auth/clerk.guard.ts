import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/clerk-sdk-node';
import { appConfig } from '../config/app.config';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@Injectable()
export class ClerkGuard implements CanActivate {
  private clerkClient: ReturnType<typeof createClerkClient> | null = null;

  constructor() {
    if (appConfig.clerk.secretKey) {
      this.clerkClient = createClerkClient({
        secretKey: appConfig.clerk.secretKey,
      });
    } else {
      console.warn('CLERK_SECRET_KEY is not set. Authentication will be disabled.');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // If Clerk is not configured, allow all requests (for development)
    if (!this.clerkClient) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // If no auth header, allow request (optional auth for now)
    // In production, you might want to require auth for protected routes
    if (!authHeader) {
      return true;
    }

    try {
      // Extract token from "Bearer <token>" format
      const token = authHeader.replace('Bearer ', '');
      
      // Verify the session token with Clerk
      const session = await verifyToken(token, {
        secretKey: appConfig.clerk.secretKey,
      });
      
      // Attach user info to request for use in controllers
      // verifyToken returns a JWT payload with standard claims
      request.user = {
        id: (session as any).sub || (session as any).userId || null,
        sessionId: (session as any).sid || (session as any).sessionId || null,
      };

      return true;
    } catch (error) {
      // If token verification fails, allow request but don't set user
      // This allows optional authentication
      console.warn('Token verification failed:', error);
      return true;
    }
  }
}
