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

    // If no auth header, don't set user (controllers will handle 401)
    if (!authHeader) {
      return true;
    }

    try {
      // Extract token from "Bearer <token>" format
      const token = authHeader.replace('Bearer ', '').trim();
      
      if (!token) {
        return true;
      }
      
      // Verify the session token with Clerk
      // Clerk's getToken() returns a JWT that can be verified with verifyToken
      const session = await verifyToken(token, {
        secretKey: appConfig.clerk.secretKey,
      });
      
      // Get user ID from session (JWT payload)
      const userId = (session as any).sub || (session as any).userId;
      
      if (!userId) {
        return true;
      }
      
      // Fetch user details from Clerk
      try {
        const clerkUser = await this.clerkClient.users.getUser(userId);
        // Attach user info to request for use in controllers
        request.user = {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || null,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          imageUrl: clerkUser.imageUrl || null,
        };
      } catch (userError) {
        // If we can't fetch user details, still attach the ID
        request.user = {
          id: userId,
          email: null,
          firstName: null,
          lastName: null,
          imageUrl: null,
        };
      }

      return true;
    } catch (error) {
      // If token verification fails, allow request
      // Controllers will check for req.user and throw 401 if needed
      return true;
    }
  }
}
