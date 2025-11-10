import { Test, TestingModule } from '@nestjs/testing';
import { ClerkService } from './clerk.service';
import { appConfig } from '../config/app.config';

// Mock the app config
jest.mock('../config/app.config', () => ({
  appConfig: {
    clerk: {
      secretKey: 'test-secret-key',
    },
  },
}));

// Mock @clerk/backend
jest.mock('@clerk/backend', () => ({
  createClerkClient: jest.fn(() => ({
    users: {
      updateUserMetadata: jest.fn(),
    },
  })),
}));

describe('ClerkService', () => {
  let service: ClerkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClerkService],
    }).compile();

    service = module.get<ClerkService>(ClerkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateUserRoles', () => {
    it('should update user roles in Clerk', async () => {
      const userId = 'user-123';
      const roles = ['admin', 'user'];
      const mockClient = service.getClient();

      if (mockClient) {
        const updateSpy = jest.spyOn(mockClient.users, 'updateUserMetadata').mockResolvedValue({} as any);

        await service.updateUserRoles(userId, roles);

        expect(updateSpy).toHaveBeenCalledWith(userId, {
          publicMetadata: {
            roles,
          },
        });
      }
    });

    it('should handle missing Clerk client gracefully', async () => {
      // Create a service without Clerk client
      const serviceWithoutClient = new ClerkService();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Mock appConfig to not have secretKey
      jest.spyOn(require('../config/app.config'), 'appConfig', 'get').mockReturnValue({
        clerk: {
          secretKey: null,
        },
      });

      await serviceWithoutClient.updateUserRoles('user-123', ['admin']);

      // Should not throw, just log a warning
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should throw error if Clerk API call fails', async () => {
      const userId = 'user-123';
      const roles = ['admin'];
      const error = new Error('Clerk API error');
      const mockClient = service.getClient();

      if (mockClient) {
        jest.spyOn(mockClient.users, 'updateUserMetadata').mockRejectedValue(error);

        await expect(service.updateUserRoles(userId, roles)).rejects.toThrow('Clerk API error');
      }
    });
  });

  describe('getClient', () => {
    it('should return Clerk client if available', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
    });

    it('should return null if Clerk client is not available', () => {
      // Create a service without Clerk client
      jest.spyOn(require('../config/app.config'), 'appConfig', 'get').mockReturnValue({
        clerk: {
          secretKey: null,
        },
      });

      const serviceWithoutClient = new ClerkService();
      const client = serviceWithoutClient.getClient();

      expect(client).toBeNull();
    });
  });
});
