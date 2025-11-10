import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotRepository } from './bot.repository';
import { MemoryRepository } from '../memory/memory.repository';
import { UserService } from '../user/user.service';

describe('BotService', () => {
  let service: BotService;
  let botRepository: BotRepository;
  let memoryRepository: MemoryRepository;
  let userService: UserService;

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

  const mockMemoryRepository = {
    findAllByBotIdAndUserId: jest.fn(),
    deleteById: jest.fn(),
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
          provide: MemoryRepository,
          useValue: mockMemoryRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<BotService>(BotService);
    botRepository = module.get<BotRepository>(BotRepository);
    memoryRepository = module.get<MemoryRepository>(MemoryRepository);
    userService = module.get<UserService>(UserService);
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
      expect(botRepository.findAll).toHaveBeenCalledWith(userId);
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
      expect(botRepository.findByIdWithConfig).toHaveBeenCalledWith(botId, userId);
      expect(botRepository.findById).toHaveBeenCalledWith(botId);
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const userId = 'user-123';

      mockBotRepository.findByIdWithConfig.mockResolvedValue(null);

      await expect(service.findById(botId, userId)).rejects.toThrow(HttpException);
      await expect(service.findById(botId, userId)).rejects.toThrow('Bot not found');
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
      expect(botRepository.findByName).toHaveBeenCalledWith(name, userId);
      expect(botRepository.create).toHaveBeenCalledWith(userId, name, description);
      expect(botRepository.updateConfigs).toHaveBeenCalledWith(mockBot.id, configs);
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
      expect(botRepository.updateConfigs).not.toHaveBeenCalled();
    });

    it('should throw HttpException if name is empty', async () => {
      const userId = 'user-123';
      const name = '';

      await expect(service.create(userId, name)).rejects.toThrow(HttpException);
      await expect(service.create(userId, name)).rejects.toThrow('Bot name is required');
    });

    it('should throw HttpException if name is only whitespace', async () => {
      const userId = 'user-123';
      const name = '   ';

      await expect(service.create(userId, name)).rejects.toThrow(HttpException);
      await expect(service.create(userId, name)).rejects.toThrow('Bot name is required');
    });

    it('should throw HttpException if bot with same name exists', async () => {
      const userId = 'user-123';
      const name = 'Existing Bot';
      const existingBot = { id: 1, name, userId };

      mockBotRepository.findByName.mockResolvedValue(existingBot);

      await expect(service.create(userId, name)).rejects.toThrow(HttpException);
      await expect(service.create(userId, name)).rejects.toThrow(
        'Bot with this name already exists',
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

      const result = await service.update(botId, userId, name, description, configs);

      expect(result).toEqual(updatedBot);
      expect(botRepository.findByIdAndUserId).toHaveBeenCalledWith(botId, userId);
      expect(botRepository.update).toHaveBeenCalledWith(botId, userId, name, description);
      expect(botRepository.updateConfigs).toHaveBeenCalledWith(botId, configs);
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const userId = 'user-123';
      const name = 'Updated Bot';

      mockBotRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.update(botId, userId, name)).rejects.toThrow(HttpException);
      await expect(service.update(botId, userId, name)).rejects.toThrow('Bot not found');
    });

    it('should throw HttpException if name is empty', async () => {
      const botId = 1;
      const userId = 'user-123';
      const name = '';
      const existingBot = { id: botId, name: 'Old Bot', userId };

      mockBotRepository.findByIdAndUserId.mockResolvedValue(existingBot);

      await expect(service.update(botId, userId, name)).rejects.toThrow(HttpException);
      await expect(service.update(botId, userId, name)).rejects.toThrow('Bot name is required');
    });

    it('should throw HttpException if new name conflicts with another bot', async () => {
      const botId = 1;
      const userId = 'user-123';
      const name = 'Conflicting Bot';
      const existingBot = { id: botId, name: 'Old Bot', userId };
      const conflictingBot = { id: 2, name, userId };

      mockBotRepository.findByIdAndUserId.mockResolvedValue(existingBot);
      mockBotRepository.findByName.mockResolvedValue(conflictingBot);

      await expect(service.update(botId, userId, name)).rejects.toThrow(HttpException);
      await expect(service.update(botId, userId, name)).rejects.toThrow(
        'Bot with this name already exists',
      );
    });
  });

  describe('getEmbeddings', () => {
    it('should return embeddings for a bot', async () => {
      const botId = 1;
      const userId = 'user-123';
      const mockBot = { id: botId, name: 'Test Bot', userId };
      const mockEmbeddings = [
        {
          id: 1,
          sessionId: 1,
          chunk: 'Test chunk',
          createdAt: new Date(),
        },
      ];

      mockBotRepository.findByIdAndUserId.mockResolvedValue(mockBot);
      mockMemoryRepository.findAllByBotIdAndUserId.mockResolvedValue(mockEmbeddings);

      const result = await service.getEmbeddings(botId, userId);

      expect(result).toEqual([
        {
          id: mockEmbeddings[0].id,
          sessionId: mockEmbeddings[0].sessionId,
          chunk: mockEmbeddings[0].chunk,
          createdAt: mockEmbeddings[0].createdAt,
        },
      ]);
      expect(botRepository.findByIdAndUserId).toHaveBeenCalledWith(botId, userId);
      expect(memoryRepository.findAllByBotIdAndUserId).toHaveBeenCalledWith(botId, userId);
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const userId = 'user-123';

      mockBotRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.getEmbeddings(botId, userId)).rejects.toThrow(HttpException);
      await expect(service.getEmbeddings(botId, userId)).rejects.toThrow('Bot not found');
    });
  });

  describe('deleteEmbedding', () => {
    it('should delete an embedding', async () => {
      const botId = 1;
      const embeddingId = 1;
      const userId = 'user-123';
      const mockBot = { id: botId, name: 'Test Bot', userId };
      const mockEmbeddings = [
        {
          id: embeddingId,
          sessionId: 1,
          chunk: 'Test chunk',
        },
      ];

      mockBotRepository.findByIdAndUserId.mockResolvedValue(mockBot);
      mockMemoryRepository.findAllByBotIdAndUserId.mockResolvedValue(mockEmbeddings);

      await service.deleteEmbedding(botId, embeddingId, userId);

      expect(memoryRepository.deleteById).toHaveBeenCalledWith(embeddingId);
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const embeddingId = 1;
      const userId = 'user-123';

      mockBotRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.deleteEmbedding(botId, embeddingId, userId)).rejects.toThrow(
        HttpException,
      );
      await expect(service.deleteEmbedding(botId, embeddingId, userId)).rejects.toThrow(
        'Bot not found',
      );
    });

    it('should throw HttpException if embedding not found', async () => {
      const botId = 1;
      const embeddingId = 999;
      const userId = 'user-123';
      const mockBot = { id: botId, name: 'Test Bot', userId };
      const mockEmbeddings = [
        {
          id: 1,
          sessionId: 1,
          chunk: 'Test chunk',
        },
      ];

      mockBotRepository.findByIdAndUserId.mockResolvedValue(mockBot);
      mockMemoryRepository.findAllByBotIdAndUserId.mockResolvedValue(mockEmbeddings);

      await expect(service.deleteEmbedding(botId, embeddingId, userId)).rejects.toThrow(
        HttpException,
      );
      await expect(service.deleteEmbedding(botId, embeddingId, userId)).rejects.toThrow(
        'Embedding not found or does not belong to this bot',
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

      expect(botRepository.findByIdAndUserId).toHaveBeenCalledWith(botId, userId);
      expect(botRepository.delete).toHaveBeenCalledWith(botId, userId);
    });

    it('should throw HttpException if bot not found', async () => {
      const botId = 1;
      const userId = 'user-123';

      mockBotRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.delete(botId, userId)).rejects.toThrow(HttpException);
      await expect(service.delete(botId, userId)).rejects.toThrow('Bot not found');
    });
  });
});
