import { Injectable, Logger } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';
import { appConfig } from '../config/app.config';

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private readonly clerkClient: ReturnType<typeof createClerkClient> | null = null;

  constructor() {
    if (appConfig.clerk.secretKey) {
      this.clerkClient = createClerkClient({
        secretKey: appConfig.clerk.secretKey,
      });
    }
  }

  async updateUserRoles(userId: string, roles: string[]): Promise<void> {
    if (!this.clerkClient) {
      this.logger.warn('Clerk client not available, cannot update roles');
      return;
    }

    try {
      await this.clerkClient.users.updateUserMetadata(userId, {
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
    return this.clerkClient;
  }
}
