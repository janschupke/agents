import { Test, TestingModule } from '@nestjs/testing';
import { ClerkService } from './clerk.service';

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
        const updateSpy = jest
          .spyOn(mockClient.users, 'updateUserMetadata')
          .mockResolvedValue(
            {} as unknown as Awaited<
              ReturnType<typeof mockClient.users.updateUserMetadata>
            >
          );

        await service.updateUserRoles(userId, roles);

        expect(updateSpy).toHaveBeenCalledWith(userId, {
          publicMetadata: {
            roles,
          },
        });
      }
    });

    it('should handle missing Clerk client gracefully', async () => {
      // Create a service without Clerk client by creating a new instance with mocked config
      jest.resetModules();
      jest.doMock('../config/app.config', () => ({
        appConfig: {
          clerk: {
            secretKey: null,
          },
        },
      }));

      const { ClerkService: ClerkServiceWithoutClient } = await import(
        './clerk.service'
      );
      const serviceWithoutClient = new ClerkServiceWithoutClient();
      const loggerSpy = jest
        .spyOn(serviceWithoutClient['logger'], 'warn')
        .mockImplementation();

      await serviceWithoutClient.updateUserRoles('user-123', ['admin']);

      // Should not throw, just log a warning
      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();

      // Restore modules
      jest.resetModules();
    });

    it('should throw error if Clerk API call fails', async () => {
      const userId = 'user-123';
      const roles = ['admin'];
      const error = new Error('Clerk API error');
      const mockClient = service.getClient();

      if (mockClient) {
        jest
          .spyOn(mockClient.users, 'updateUserMetadata')
          .mockRejectedValue(error);

        await expect(service.updateUserRoles(userId, roles)).rejects.toThrow(
          'Clerk API error'
        );
      }
    });
  });

  describe('getClient', () => {
    it('should return Clerk client if available', () => {
      const client = service.getClient();
      expect(client).toBeDefined();
    });

    it('should return null if Clerk client is not available', async () => {
      // Create a service without Clerk client by mocking the config
      jest.resetModules();
      jest.doMock('../config/app.config', () => ({
        appConfig: {
          clerk: {
            secretKey: null,
          },
        },
      }));

      const { ClerkService: ClerkServiceWithoutClient } = await import(
        './clerk.service'
      );
      const serviceWithoutClient = new ClerkServiceWithoutClient();
      const client = serviceWithoutClient.getClient();

      expect(client).toBeNull();

      // Restore modules
      jest.resetModules();
    });
  });
});
