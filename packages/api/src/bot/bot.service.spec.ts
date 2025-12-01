import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotRepository } from './bot.repository';
import { UserService } from '../user/user.service';

describe('BotService', () => {
  let service: BotService;

  const mockBotRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIdWithConfig: jest.fn(),
    findByIdAndUserId: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateConfigs: jest.fn(),
    delete: jest.fn(),
    mergeBotConfig: jest.fn(),
  };

  const mockUserService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BotService,
        {
          provide: BotRepository,
          useValue: mockBotRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<BotService>(BotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all bots for a user', async () => {
      const userId = 'user-123';
      const mockBots = [
        { id: 1, name: 'Bot 1', description: 'Description 1', userId },
        { id: 2, name: 'Bot 2', description: 'Description 2', userId },
      ];

      mockBotRepository.findAll.mockResolvedValue(mockBots);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockBots);
      expect(mockBotRepository.findAll).toHaveBeenCalledWith(userId);
    });
  });

  describe('findById', () => {
    it('should return a bot by id', async () => {
      const botId = 1;
      const userId = 'user-123';
      const mockBot = {
        id: botId,
        name: 'Test Bot',
        description: 'Test Description',
        userId,
      };
      const mockBotWithConfig = {
        ...mockBot,
        configs: [{ key: 'temperature', value: '0.7' }],
      };

      mockBotRepository.findByIdWithConfig.mockResolvedValue(mockBotWithConfig);
      mockBotRepository.findById.mockResolvedValue(mockBot);

      const result = await service.findById(botId, userId);

      expect(result).toEqual({
        ...mockBot,
        configs: mockBotWithConfig.configs,
      });
      expect(mockBotRepository.findByIdWithConfig).toHaveBeenCalledWith(
        botId,
        userId
      );
      expect(mockBotRepository.findById).toHaveBeenCalledWith(botId);
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const userId = 'user-123';

      mockBotRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.findById(botId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.findById(botId, userId)).rejects.toThrow(
        'Bot not found'
      );
    });
  });

  describe('create', () => {
    it('should create a new bot', async () => {
      const userId = 'user-123';
      const name = 'New Bot';
      const description = 'New Description';
      const configs = { temperature: 0.7 };
      const mockBot = {
        id: 1,
        name,
        description,
        userId,
      };

      mockBotRepository.findByName.mockResolvedValue(null);
      mockBotRepository.create.mockResolvedValue(mockBot);

      const result = await service.create(userId, name, description, configs);

      expect(result).toEqual(mockBot);
      expect(mockBotRepository.findByName).toHaveBeenCalledWith(name, userId);
      expect(mockBotRepository.create).toHaveBeenCalledWith(
        userId,
        name,
        description
      );
      expect(mockBotRepository.updateConfigs).toHaveBeenCalledWith(
        mockBot.id,
        configs
      );
    });

    it('should create a bot without configs', async () => {
      const userId = 'user-123';
      const name = 'New Bot';
      const mockBot = {
        id: 1,
        name,
        description: null,
        userId,
      };

      mockBotRepository.findByName.mockResolvedValue(null);
      mockBotRepository.create.mockResolvedValue(mockBot);

      const result = await service.create(userId, name);

      expect(result).toEqual(mockBot);
      expect(mockBotRepository.updateConfigs).not.toHaveBeenCalled();
    });

    it('should throw HttpException if name is empty', async () => {
      const userId = 'user-123';
      const name = '';

      await expect(service.create(userId, name)).rejects.toThrow(HttpException);
      await expect(service.create(userId, name)).rejects.toThrow(
        'Bot name is required'
      );
    });

    it('should throw HttpException if name is only whitespace', async () => {
      const userId = 'user-123';
      const name = '   ';

      await expect(service.create(userId, name)).rejects.toThrow(HttpException);
      await expect(service.create(userId, name)).rejects.toThrow(
        'Bot name is required'
      );
    });

    it('should throw HttpException if bot with same name exists', async () => {
      const userId = 'user-123';
      const name = 'Existing Bot';
      const existingBot = { id: 1, name, userId };

      mockBotRepository.findByName.mockResolvedValue(existingBot);

      await expect(service.create(userId, name)).rejects.toThrow(HttpException);
      await expect(service.create(userId, name)).rejects.toThrow(
        'Bot with this name already exists'
      );
    });
  });

  describe('update', () => {
    it('should update a bot', async () => {
      const botId = 1;
      const userId = 'user-123';
      const name = 'Updated Bot';
      const description = 'Updated Description';
      const configs = { temperature: 0.8 };
      const existingBot = {
        id: botId,
        name: 'Old Bot',
        description: 'Old Description',
        userId,
      };
      const updatedBot = {
        ...existingBot,
        name,
        description,
      };

      mockBotRepository.findByIdAndUserId.mockResolvedValue(existingBot);
      mockBotRepository.findByName.mockResolvedValue(null);
      mockBotRepository.update.mockResolvedValue(updatedBot);

      const result = await service.update(
        botId,
        userId,
        name,
        description,
        configs
      );

      expect(result).toEqual(updatedBot);
      expect(mockBotRepository.findByIdAndUserId).toHaveBeenCalledWith(
        botId,
        userId
      );
      expect(mockBotRepository.update).toHaveBeenCalledWith(
        botId,
        userId,
        name,
        description
      );
      expect(mockBotRepository.updateConfigs).toHaveBeenCalledWith(
        botId,
        configs
      );
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const userId = 'user-123';
      const name = 'Updated Bot';

      mockBotRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.update(botId, userId, name)).rejects.toThrow(
        HttpException
      );
      await expect(service.update(botId, userId, name)).rejects.toThrow(
        'Bot not found'
      );
    });

    it('should throw HttpException if name is empty', async () => {
      const botId = 1;
      const userId = 'user-123';
      const name = '';
      const existingBot = { id: botId, name: 'Old Bot', userId };

      mockBotRepository.findByIdAndUserId.mockResolvedValue(existingBot);

      await expect(service.update(botId, userId, name)).rejects.toThrow(
        HttpException
      );
      await expect(service.update(botId, userId, name)).rejects.toThrow(
        'Bot name is required'
      );
    });

    it('should throw HttpException if new name conflicts with another bot', async () => {
      const botId = 1;
      const userId = 'user-123';
      const name = 'Conflicting Bot';
      const existingBot = { id: botId, name: 'Old Bot', userId };
      const conflictingBot = { id: 2, name, userId };

      mockBotRepository.findByIdAndUserId.mockResolvedValue(existingBot);
      mockBotRepository.findByName.mockResolvedValue(conflictingBot);

      await expect(service.update(botId, userId, name)).rejects.toThrow(
        HttpException
      );
      await expect(service.update(botId, userId, name)).rejects.toThrow(
        'Bot with this name already exists'
      );
    });
  });

  describe('delete', () => {
    it('should delete a bot', async () => {
      const botId = 1;
      const userId = 'user-123';
      const mockBot = { id: botId, name: 'Test Bot', userId };

      mockBotRepository.findByIdAndUserId.mockResolvedValue(mockBot);
      mockBotRepository.delete.mockResolvedValue(undefined);

      await service.delete(botId, userId);

      expect(mockBotRepository.findByIdAndUserId).toHaveBeenCalledWith(
        botId,
        userId
      );
      expect(mockBotRepository.delete).toHaveBeenCalledWith(botId, userId);
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const userId = 'user-123';

      mockBotRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.delete(botId, userId)).rejects.toThrow(
        HttpException
      );
      await expect(service.delete(botId, userId)).rejects.toThrow(
        'Bot not found'
      );
    });
  });
});
