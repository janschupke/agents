import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ClerkWebhookService } from './clerk-webhook.service';
import { UserService } from '../user/user.service';
import { ClerkService } from '../auth/clerk.service';
import { appConfig } from '../config/app.config';

// Mock the app config
jest.mock('../config/app.config', () => ({
  appConfig: {
    clerk: {
      webhookSecret: 'test-webhook-secret',
    },
    nodeEnv: 'test',
  },
}));

// Mock svix
jest.mock('svix', () => ({
  Webhook: jest.fn().mockImplementation(() => ({
    verify: jest.fn(),
  })),
}));

describe('ClerkWebhookService', () => {
  let service: ClerkWebhookService;
  let userService: UserService;
  let clerkService: ClerkService;

  const mockUserService = {
    findOrCreate: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    syncRolesFromClerk: jest.fn(),
  };

  const mockClerkService = {
    updateUserRoles: jest.fn(),
    getClient: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClerkWebhookService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: ClerkService,
          useValue: mockClerkService,
        },
      ],
    }).compile();

    service = module.get<ClerkWebhookService>(ClerkWebhookService);
    userService = module.get<UserService>(UserService);
    clerkService = module.get<ClerkService>(ClerkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleWebhook', () => {
    it('should handle user.created event', async () => {
      const payload = {
        svixId: 'svix-id',
        svixTimestamp: '1234567890',
        svixSignature: 'signature',
        payload: Buffer.from(
          JSON.stringify({
            type: 'user.created',
            data: {
              id: 'user-123',
              email_addresses: [{ email_address: 'test@example.com' }],
              first_name: 'John',
              last_name: 'Doe',
              image_url: 'https://example.com/image.jpg',
              public_metadata: { roles: ['user'] },
            },
          }),
        ),
      };

      const mockWebhook = {
        verify: jest.fn().mockReturnValue({
          type: 'user.created',
          data: {
            id: 'user-123',
            email_addresses: [{ email_address: 'test@example.com' }],
            first_name: 'John',
            last_name: 'Doe',
            image_url: 'https://example.com/image.jpg',
            public_metadata: { roles: ['user'] },
          },
        }),
      };

      // Mock the Webhook constructor
      const { Webhook } = require('svix');
      Webhook.mockImplementation(() => mockWebhook);

      const serviceWithWebhook = new ClerkWebhookService(userService, clerkService);
      mockUserService.findOrCreate.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      });

      await serviceWithWebhook.handleWebhook(payload);

      expect(mockUserService.findOrCreate).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/image.jpg',
        roles: ['user'],
      });
    });

    it('should handle user.updated event', async () => {
      const payload = {
        svixId: 'svix-id',
        svixTimestamp: '1234567890',
        svixSignature: 'signature',
        payload: Buffer.from(
          JSON.stringify({
            type: 'user.updated',
            data: {
              id: 'user-123',
              email_addresses: [{ email_address: 'updated@example.com' }],
              first_name: 'Jane',
              last_name: 'Smith',
              public_metadata: { roles: ['admin'] },
            },
          }),
        ),
      };

      const mockWebhook = {
        verify: jest.fn().mockReturnValue({
          type: 'user.updated',
          data: {
            id: 'user-123',
            email_addresses: [{ email_address: 'updated@example.com' }],
            first_name: 'Jane',
            last_name: 'Smith',
            public_metadata: { roles: ['admin'] },
          },
        }),
      };

      const { Webhook } = require('svix');
      Webhook.mockImplementation(() => mockWebhook);

      const serviceWithWebhook = new ClerkWebhookService(userService, clerkService);
      mockUserService.update.mockResolvedValue({ id: 'user-123' });
      mockUserService.syncRolesFromClerk.mockResolvedValue({ id: 'user-123' });

      await serviceWithWebhook.handleWebhook(payload);

      expect(mockUserService.update).toHaveBeenCalledWith('user-123', {
        email: 'updated@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        imageUrl: undefined,
        roles: ['admin'],
      });
      expect(mockUserService.syncRolesFromClerk).toHaveBeenCalledWith('user-123', ['admin']);
    });

    it('should throw UnauthorizedException if webhook verification fails', async () => {
      const payload = {
        svixId: 'svix-id',
        svixTimestamp: '1234567890',
        svixSignature: 'signature',
        payload: Buffer.from(JSON.stringify({ type: 'user.created', data: {} })),
      };

      const mockWebhook = {
        verify: jest.fn().mockImplementation(() => {
          throw new Error('Invalid signature');
        }),
      };

      const { Webhook } = require('svix');
      Webhook.mockImplementation(() => mockWebhook);

      const serviceWithWebhook = new ClerkWebhookService(userService, clerkService);

      await expect(serviceWithWebhook.handleWebhook(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(serviceWithWebhook.handleWebhook(payload)).rejects.toThrow(
        'Invalid webhook signature',
      );
    });

    it('should default to ["user"] role if roles not provided', async () => {
      const payload = {
        svixId: 'svix-id',
        svixTimestamp: '1234567890',
        svixSignature: 'signature',
        payload: Buffer.from(
          JSON.stringify({
            type: 'user.created',
            data: {
              id: 'user-123',
              email_addresses: [{ email_address: 'test@example.com' }],
            },
          }),
        ),
      };

      const mockWebhook = {
        verify: jest.fn().mockReturnValue({
          type: 'user.created',
          data: {
            id: 'user-123',
            email_addresses: [{ email_address: 'test@example.com' }],
          },
        }),
      };

      const { Webhook } = require('svix');
      Webhook.mockImplementation(() => mockWebhook);

      const serviceWithWebhook = new ClerkWebhookService(userService, clerkService);
      mockUserService.findOrCreate.mockResolvedValue({ id: 'user-123' });
      mockClerkService.updateUserRoles.mockResolvedValue(undefined);

      await serviceWithWebhook.handleWebhook(payload);

      expect(mockUserService.findOrCreate).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        firstName: undefined,
        lastName: undefined,
        imageUrl: undefined,
        roles: ['user'],
      });
      expect(mockClerkService.updateUserRoles).toHaveBeenCalledWith('user-123', ['user']);
    });
  });

  describe('syncAllUserRoles', () => {
    it('should sync roles for all users', async () => {
      const mockClerkClient = {
        users: {
          getUserList: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'user-1',
                emailAddresses: [{ emailAddress: 'user1@example.com' }],
                firstName: 'John',
                lastName: 'Doe',
                imageUrl: 'https://example.com/image.jpg',
                publicMetadata: { roles: ['user'] },
              },
              {
                id: 'user-2',
                emailAddresses: [{ emailAddress: 'user2@example.com' }],
                publicMetadata: null,
              },
            ],
          }),
        },
      };

      mockClerkService.getClient.mockReturnValue(mockClerkClient);
      mockUserService.findById.mockResolvedValue({ id: 'user-1' });
      mockUserService.syncRolesFromClerk.mockResolvedValue({ id: 'user-1' });
      mockClerkService.updateUserRoles.mockResolvedValue(undefined);

      await service.syncAllUserRoles();

      expect(mockClerkClient.users.getUserList).toHaveBeenCalled();
      expect(mockUserService.syncRolesFromClerk).toHaveBeenCalled();
    });

    it('should handle missing Clerk client', async () => {
      mockClerkService.getClient.mockReturnValue(null);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await service.syncAllUserRoles();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
