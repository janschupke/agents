import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;

  const mockUserRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    updateRoles: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrCreate', () => {
    it('should create a new user', async () => {
      const userData = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/image.jpg',
        roles: ['user'],
      };
      const mockUser = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        imageUrl: userData.imageUrl,
        roles: userData.roles,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await service.findOrCreate(userData);

      expect(result).toEqual(mockUser);
      expect(userRepository.create).toHaveBeenCalledWith(userData);
    });

    it('should create a user with minimal data', async () => {
      const userData = {
        id: 'user-123',
      };
      const mockUser = {
        id: userData.id,
        email: null,
        firstName: null,
        lastName: null,
        imageUrl: null,
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await service.findOrCreate(userData);

      expect(result).toEqual(mockUser);
      expect(userRepository.create).toHaveBeenCalledWith(userData);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById(userId);

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw HttpException if user not found', async () => {
      const userId = 'user-123';

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.findById(userId)).rejects.toThrow(HttpException);
      await expect(service.findById(userId)).rejects.toThrow('User not found');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 'user-123';
      const updateData = {
        email: 'newemail@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const updatedUser = {
        id: userId,
        ...updateData,
        imageUrl: null,
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateData);
    });

    it('should update user with partial data', async () => {
      const userId = 'user-123';
      const updateData = {
        email: 'newemail@example.com',
      };
      const updatedUser = {
        id: userId,
        email: updateData.email,
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: null,
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateData);

      expect(result).toEqual(updatedUser);
      expect(userRepository.update).toHaveBeenCalledWith(userId, updateData);
    });
  });

  describe('syncRolesFromClerk', () => {
    it('should sync roles from Clerk', async () => {
      const userId = 'user-123';
      const clerkRoles = ['admin', 'user'];
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        roles: clerkRoles,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.updateRoles.mockResolvedValue(updatedUser);

      const result = await service.syncRolesFromClerk(userId, clerkRoles);

      expect(result).toEqual(updatedUser);
      expect(userRepository.updateRoles).toHaveBeenCalledWith(
        userId,
        clerkRoles
      );
    });

    it('should default to ["user"] if no roles provided', async () => {
      const userId = 'user-123';
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.updateRoles.mockResolvedValue(updatedUser);

      const result = await service.syncRolesFromClerk(userId, null);

      expect(result).toEqual(updatedUser);
      expect(userRepository.updateRoles).toHaveBeenCalledWith(userId, ['user']);
    });

    it('should default to ["user"] if empty roles array provided', async () => {
      const userId = 'user-123';
      const updatedUser = {
        id: userId,
        email: 'test@example.com',
        roles: ['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.updateRoles.mockResolvedValue(updatedUser);

      const result = await service.syncRolesFromClerk(userId, []);

      expect(result).toEqual(updatedUser);
      expect(userRepository.updateRoles).toHaveBeenCalledWith(userId, ['user']);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          roles: ['user'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          roles: ['admin'],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserRepository.findAll.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(userRepository.findAll).toHaveBeenCalled();
    });
  });
});
