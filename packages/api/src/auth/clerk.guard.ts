import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClerkClient, verifyToken } from '@clerk/clerk-sdk-node';
import { appConfig } from '../config/app.config';

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
  private clerkClient: ReturnType<typeof createClerkClient> | null = null;
  // Cache user data for 5 minutes to avoid repeated Clerk API calls
  private userCache = new Map<string, CachedUser>();
  // Cache verified tokens for 1 minute to avoid repeated verifyToken calls
  private tokenCache = new Map<string, CachedToken>();
  private readonly USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TOKEN_CACHE_TTL = 60 * 1000; // 1 minute (tokens can expire)

  constructor(private reflector: Reflector) {
    if (appConfig.clerk.secretKey) {
      this.clerkClient = createClerkClient({
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
    const perfStart = Date.now();
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
    if (!this.clerkClient) {
      return true;
    }

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
      
      // Check if we've recently verified this token (cache for 1 minute)
      const cachedUserId = this.getCachedToken(token);
      let userId: string | null = null;
      let session: any = null;
      
      if (cachedUserId) {
        // Token was recently verified, use cached userId
        userId = cachedUserId;
        const totalTime = Date.now() - perfStart;
        if (totalTime > 10) {
          console.log(`[Performance] ClerkGuard.verifyToken (cached) - ${totalTime}ms for ${path}`);
        }
      } else {
        // Verify the session token with Clerk (only if not cached)
        const verifyStart = Date.now();
        session = await verifyToken(token, {
          secretKey: appConfig.clerk.secretKey,
        });
        const verifyTime = Date.now() - verifyStart;
        if (verifyTime > 50) {
          console.log(`[Performance] ClerkGuard.verifyToken took ${verifyTime}ms for ${path}`);
        }
        
        // Get user ID from session (JWT payload)
        userId = (session as any).sub || (session as any).userId;
        
        if (userId) {
          // Cache the verified token
          this.setCachedToken(token, userId);
        }
      }
      
      if (!userId) {
        return true;
      }
      
      // Check cache first to avoid repeated Clerk API calls
      const cachedUser = this.getCachedUser(userId);
      if (cachedUser) {
        request.user = {
          id: cachedUser.id,
          email: cachedUser.email,
          firstName: cachedUser.firstName,
          lastName: cachedUser.lastName,
          imageUrl: cachedUser.imageUrl,
          roles: cachedUser.roles,
        };
        const totalTime = Date.now() - perfStart;
        if (totalTime > 100) {
          console.log(`[Performance] ClerkGuard.canActivate COMPLETE (cached) - total: ${totalTime}ms for ${path}`);
        }
        return true;
      }
      
      // Fetch user details from Clerk only if not cached
      try {
        const getUserStart = Date.now();
        console.log(`[Performance] ClerkGuard.getUser START for ${path}`);
        const clerkUser = await this.clerkClient.users.getUser(userId);
        const getUserTime = Date.now() - getUserStart;
        console.log(`[Performance] ClerkGuard.getUser COMPLETE - ${getUserTime}ms for ${path}`);
        
        // Extract roles from public metadata, default to ["user"] if not present
        const publicMetadata = clerkUser.publicMetadata as any;
        const roles = publicMetadata?.roles || ['user'];
        
        const userData: CachedUser = {
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
        
        // Attach user info to request for use in controllers
        request.user = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          imageUrl: userData.imageUrl,
          roles: userData.roles,
        };
      } catch (userError) {
        const errorTime = Date.now() - perfStart;
        console.error(`[Performance] ClerkGuard.getUser ERROR after ${errorTime}ms for ${path}:`, userError);
        // If we can't fetch user details, still attach the ID with default role
        request.user = {
          id: userId,
          email: null,
          firstName: null,
          lastName: null,
          imageUrl: null,
          roles: ['user'],
        };
      }

      const totalTime = Date.now() - perfStart;
      if (totalTime > 100) {
        console.log(`[Performance] ClerkGuard.canActivate COMPLETE - total: ${totalTime}ms for ${path}`);
      }
      return true;
    } catch (error) {
      const errorTime = Date.now() - perfStart;
      console.error(`[Performance] ClerkGuard.canActivate ERROR after ${errorTime}ms for ${path}:`, error);
      // If token verification fails, allow request
      // Controllers will check for req.user and throw 401 if needed
      return true;
    }
  }
}
