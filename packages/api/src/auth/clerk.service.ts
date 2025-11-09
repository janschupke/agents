import { Injectable, Logger } from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { appConfig } from '../config/app.config';

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private readonly clerk: ReturnType<typeof createClerkClient> | null = null;

  constructor() {
    if (appConfig.clerk.secretKey) {
      this.clerk = createClerkClient({
        secretKey: appConfig.clerk.secretKey,
      });
    }
  }

  async updateUserRoles(userId: string, roles: string[]): Promise<void> {
    if (!this.clerk) {
      this.logger.warn('Clerk client not available, cannot update roles');
      return;
    }

    try {
      await this.clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          roles,
        },
      });
      this.logger.log(`Updated Clerk roles for user ${userId}: ${roles.join(', ')}`);
    } catch (error) {
      this.logger.error(`Failed to update Clerk roles for user ${userId}:`, error);
      throw error;
    }
  }

  getClient(): ReturnType<typeof createClerkClient> | null {
    return this.clerk;
  }
}
