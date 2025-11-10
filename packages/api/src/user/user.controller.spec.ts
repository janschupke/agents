import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ClerkService } from '../auth/clerk.service';
import { AuthenticatedUser } from '../common/types/auth.types';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let clerkService: ClerkService;

  const mockUserService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    syncRolesFromClerk: jest.fn(),
  };

  const mockClerkService = {
    updateUserRoles: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    roles: ['user'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
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

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    clerkService = module.get<ClerkService>(ClerkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          imageUrl: null,
          roles: ['user'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          imageUrl: null,
          roles: ['admin'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserService.findAll.mockResolvedValue(mockUsers);

      const result = await controller.getAllUsers();

      expect(result).toEqual([
        {
          id: mockUsers[0].id,
          email: mockUsers[0].email,
          firstName: mockUsers[0].firstName,
          lastName: mockUsers[0].lastName,
          imageUrl: mockUsers[0].imageUrl,
          roles: mockUsers[0].roles,
          createdAt: mockUsers[0].createdAt,
          updatedAt: mockUsers[0].updatedAt,
        },
        {
          id: mockUsers[1].id,
          email: mockUsers[1].email,
          firstName: mockUsers[1].firstName,
          lastName: mockUsers[1].lastName,
          imageUrl: mockUsers[1].imageUrl,
          roles: mockUsers[1].roles,
          createdAt: mockUsers[1].createdAt,
          updatedAt: mockUsers[1].updatedAt,
        },
      ]);
      expect(userService.findAll).toHaveBeenCalled();
    });

    it('should throw HttpException on service error', async () => {
      const error = new HttpException('Service error', HttpStatus.INTERNAL_SERVER_ERROR);
      mockUserService.findAll.mockRejectedValue(error);

      await expect(controller.getAllUsers()).rejects.toThrow(HttpException);
      await expect(controller.getAllUsers()).rejects.toThrow('Service error');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user with roles', async () => {
      const dbUser = {
        id: mockUser.id,
        email: mockUser.email,
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: null,
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.syncRolesFromClerk.mockResolvedValue(dbUser);
      mockUserService.findById.mockResolvedValue(dbUser);

      const result = await controller.getCurrentUser(mockUser);

      expect(result).toEqual({
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        imageUrl: dbUser.imageUrl,
        roles: dbUser.roles,
      });
      expect(userService.syncRolesFromClerk).toHaveBeenCalledWith(mockUser.id, ['user']);
      expect(userService.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should default to ["user"] role if user has no roles', async () => {
      const userWithoutRoles: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        roles: [],
      };
      const dbUser = {
        id: userWithoutRoles.id,
        email: userWithoutRoles.email,
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: null,
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClerkService.updateUserRoles.mockResolvedValue(undefined);
      mockUserService.syncRolesFromClerk.mockResolvedValue(dbUser);
      mockUserService.findById.mockResolvedValue(dbUser);

      const result = await controller.getCurrentUser(userWithoutRoles);

      expect(result.roles).toEqual(['user']);
      expect(mockClerkService.updateUserRoles).toHaveBeenCalledWith(userWithoutRoles.id, ['user']);
      expect(userService.syncRolesFromClerk).toHaveBeenCalledWith(userWithoutRoles.id, ['user']);
    });

    it('should update Clerk roles if user has no roles', async () => {
      const userWithoutRoles: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
      };
      const dbUser = {
        id: userWithoutRoles.id,
        email: userWithoutRoles.email,
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockClerkService.updateUserRoles.mockResolvedValue(undefined);
      mockUserService.syncRolesFromClerk.mockResolvedValue(dbUser);
      mockUserService.findById.mockResolvedValue(dbUser);

      await controller.getCurrentUser(userWithoutRoles);

      expect(mockClerkService.updateUserRoles).toHaveBeenCalledWith(userWithoutRoles.id, ['user']);
    });

    it('should not fail if Clerk update fails', async () => {
      const userWithoutRoles: AuthenticatedUser = {
        id: 'user-123',
        email: 'test@example.com',
        roles: [],
      };
      const dbUser = {
        id: userWithoutRoles.id,
        email: userWithoutRoles.email,
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockClerkService.updateUserRoles.mockRejectedValue(new Error('Clerk error'));
      mockUserService.syncRolesFromClerk.mockResolvedValue(dbUser);
      mockUserService.findById.mockResolvedValue(dbUser);

      const result = await controller.getCurrentUser(userWithoutRoles);

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should throw HttpException on service error', async () => {
      const error = new HttpException('User not found', HttpStatus.NOT_FOUND);
      mockUserService.syncRolesFromClerk.mockRejectedValue(error);

      await expect(controller.getCurrentUser(mockUser)).rejects.toThrow(HttpException);
      await expect(controller.getCurrentUser(mockUser)).rejects.toThrow('User not found');
    });
  });
});
