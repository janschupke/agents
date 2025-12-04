import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

export interface CachedUser {
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

/**
 * Service responsible for caching authentication-related data
 * Separates caching concerns from authentication logic
 */
@Injectable()
export class AuthCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthCacheService.name);
  // Cache user data for 5 minutes to avoid repeated Clerk API calls
  private readonly userCache = new Map<string, CachedUser>();
  // Cache verified tokens for 1 minute to avoid repeated verifyToken calls
  private readonly tokenCache = new Map<string, CachedToken>();
  private readonly USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TOKEN_CACHE_TTL = 60 * 1000; // 1 minute (tokens can expire)
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired cache entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanupExpiredEntries();
      },
      5 * 60 * 1000
    );
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cached user data
   */
  getCachedUser(userId: string): CachedUser | null {
    const cached = this.userCache.get(userId);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.cachedAt > this.USER_CACHE_TTL) {
      this.userCache.delete(userId);
      this.logger.debug(`User cache expired for ${userId}`);
      return null;
    }

    return cached;
  }

  /**
   * Set cached user data
   */
  setCachedUser(user: CachedUser): void {
    this.userCache.set(user.id, { ...user, cachedAt: Date.now() });
    this.logger.debug(`Cached user data for ${user.id}`);
  }

  /**
   * Get cached token verification result
   */
  getCachedToken(token: string): string | null {
    const cached = this.tokenCache.get(token);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.verifiedAt > this.TOKEN_CACHE_TTL) {
      this.tokenCache.delete(token);
      this.logger.debug('Token cache expired');
      return null;
    }

    return cached.userId;
  }

  /**
   * Set cached token verification result
   */
  setCachedToken(token: string, userId: string): void {
    this.tokenCache.set(token, { userId, verifiedAt: Date.now() });
    this.logger.debug(`Cached token verification for user ${userId}`);
  }

  /**
   * Clear all caches (useful for testing or manual invalidation)
   */
  clearAllCaches(): void {
    this.userCache.clear();
    this.tokenCache.clear();
    this.logger.log('Cleared all authentication caches');
  }

  /**
   * Clear cache for a specific user
   */
  clearUserCache(userId: string): void {
    this.userCache.delete(userId);
    this.logger.debug(`Cleared cache for user ${userId}`);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let userCleanupCount = 0;
    let tokenCleanupCount = 0;

    for (const [userId, user] of this.userCache.entries()) {
      if (now - user.cachedAt > this.USER_CACHE_TTL) {
        this.userCache.delete(userId);
        userCleanupCount++;
      }
    }

    for (const [token, cached] of this.tokenCache.entries()) {
      if (now - cached.verifiedAt > this.TOKEN_CACHE_TTL) {
        this.tokenCache.delete(token);
        tokenCleanupCount++;
      }
    }

    if (userCleanupCount > 0 || tokenCleanupCount > 0) {
      this.logger.debug(
        `Cleaned up ${userCleanupCount} expired user entries and ${tokenCleanupCount} expired token entries`
      );
    }
  }
}
