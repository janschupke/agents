import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Webhook } from 'svix';
import { appConfig } from '../config/app.config';
import { UserService } from '../user/user.service';
import { ClerkService } from '../auth/clerk.service';
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';

interface WebhookPayload {
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  payload: Buffer;
}

interface ClerkWebhookEvent {
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    public_metadata?: {
      roles?: string[];
    };
  };
  type: string;
}

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);
  private readonly webhook: Webhook | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly clerkService: ClerkService
  ) {
    if (appConfig.clerk.webhookSecret) {
      this.webhook = new Webhook(appConfig.clerk.webhookSecret);
    } else {
      if (appConfig.nodeEnv === 'production') {
        this.logger.warn(
          'CLERK_WEBHOOK_SECRET is not set in production. Webhook verification will be disabled.'
        );
      } else {
        this.logger.warn(
          'CLERK_WEBHOOK_SECRET is not set. Webhook verification disabled for local development.'
        );
      }
    }
  }

  async handleWebhook(payload: WebhookPayload) {
    // In development, allow webhooks without verification if secret is not set
    if (!this.webhook) {
      if (appConfig.nodeEnv === 'production') {
        throw new UnauthorizedException('Webhook secret not configured');
      }
      // In development, skip verification and parse the payload directly
      this.logger.warn(
        'Processing webhook without verification (development mode)'
      );
      return this.handleWebhookWithoutVerification(payload);
    }

    try {
      // Verify webhook signature
      const evt = this.webhook.verify(payload.payload, {
        'svix-id': payload.svixId,
        'svix-timestamp': payload.svixTimestamp,
        'svix-signature': payload.svixSignature,
      }) as ClerkWebhookEvent;

      this.logger.log(`Received webhook event: ${evt.type}`);

      // Handle different webhook event types
      switch (evt.type) {
        case 'user.created':
          await this.handleUserCreated(evt.data);
          break;
        case 'user.updated':
          await this.handleUserUpdated(evt.data);
          break;
        default:
          this.logger.debug(`Unhandled webhook event type: ${evt.type}`);
      }
    } catch (error) {
      this.logger.error('Webhook verification failed:', error);
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }

  /**
   * Handle webhook without signature verification (development only)
   */
  private async handleWebhookWithoutVerification(payload: WebhookPayload) {
    try {
      // Parse the payload as JSON (it's already a Buffer)
      const evt = JSON.parse(payload.payload.toString()) as ClerkWebhookEvent;

      this.logger.log(`Received webhook event (unverified): ${evt.type}`);

      // Handle different webhook event types
      switch (evt.type) {
        case 'user.created':
          await this.handleUserCreated(evt.data);
          break;
        case 'user.updated':
          await this.handleUserUpdated(evt.data);
          break;
        default:
          this.logger.debug(`Unhandled webhook event type: ${evt.type}`);
      }
    } catch (error) {
      this.logger.error('Failed to process webhook payload:', error);
      throw new UnauthorizedException('Invalid webhook payload');
    }
  }

  private async handleUserCreated(data: ClerkWebhookEvent['data']) {
    // Extract roles from public metadata, default to ["user"] if not present
    const roles =
      data.public_metadata?.roles || [MAGIC_STRINGS.DEFAULT_USER_ROLE];

    // Create user in DB
    await this.userService.findOrCreate({
      id: data.id,
      email: data.email_addresses?.[0]?.email_address,
      firstName: data.first_name || undefined,
      lastName: data.last_name || undefined,
      imageUrl: data.image_url || undefined,
      roles,
    });

    // If roles weren't set in Clerk, update Clerk metadata
    if (!data.public_metadata?.roles) {
      await this.updateClerkRoles(data.id, roles);
    }

    this.logger.log(`User created: ${data.id} with roles: ${roles.join(', ')}`);
  }

  private async handleUserUpdated(data: ClerkWebhookEvent['data']) {
    // Extract roles from public metadata
    const roles =
      data.public_metadata?.roles || [MAGIC_STRINGS.DEFAULT_USER_ROLE];

    // Update user in DB
    await this.userService.update(data.id, {
      email: data.email_addresses?.[0]?.email_address,
      firstName: data.first_name || undefined,
      lastName: data.last_name || undefined,
      imageUrl: data.image_url || undefined,
      roles,
    });

    // Sync roles to DB
    await this.userService.syncRolesFromClerk(data.id, roles);

    this.logger.log(`User updated: ${data.id} with roles: ${roles.join(', ')}`);
  }

  private async updateClerkRoles(userId: string, roles: string[]) {
    await this.clerkService.updateUserRoles(userId, roles);
  }

  /**
   * Sync roles for all existing users who don't have roles set
   * This should be called once to migrate existing users
   */
  async syncAllUserRoles() {
    const clerkClient = this.clerkService.getClient();
    if (!clerkClient) {
      this.logger.warn('Clerk client not available, cannot sync roles');
      return;
    }

    try {
      // Get all users from Clerk
      const clerkUsers = await clerkClient.users.getUserList();

      for (const clerkUser of clerkUsers.data) {
        const userId = clerkUser.id;
        const roles = (
          clerkUser.publicMetadata as { roles?: string[] } | null | undefined
        )?.roles;

        // If user doesn't have roles, set default and update both Clerk and DB
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
          const defaultRoles = [MAGIC_STRINGS.DEFAULT_USER_ROLE];

          // Update Clerk
          await this.updateClerkRoles(userId, defaultRoles);

          // Update or create in DB
          const dbUser = await this.userService
            .findById(userId)
            .catch(() => null);
          if (dbUser) {
            await this.userService.syncRolesFromClerk(userId, defaultRoles);
          } else {
            await this.userService.findOrCreate({
              id: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress,
              firstName: clerkUser.firstName || undefined,
              lastName: clerkUser.lastName || undefined,
              imageUrl: clerkUser.imageUrl || undefined,
              roles: defaultRoles,
            });
          }

          this.logger.log(
            `Synced roles for user ${userId}: ${defaultRoles.join(', ')}`
          );
        } else {
          // User has roles, just sync to DB
          const dbUser = await this.userService
            .findById(userId)
            .catch(() => null);
          if (dbUser) {
            await this.userService.syncRolesFromClerk(userId, roles);
          } else {
            await this.userService.findOrCreate({
              id: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress,
              firstName: clerkUser.firstName || undefined,
              lastName: clerkUser.lastName || undefined,
              imageUrl: clerkUser.imageUrl || undefined,
              roles,
            });
          }
        }
      }

      this.logger.log(`Synced roles for ${clerkUsers.data.length} users`);
    } catch (error) {
      this.logger.error('Failed to sync all user roles:', error);
      throw error;
    }
  }
}
