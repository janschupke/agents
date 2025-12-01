import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { AuthenticatedUser } from '../common/types/auth.types';

describe('BotController', () => {
  let controller: BotController;
  let botService: BotService;

  const mockBotService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    imageUrl: null,
    roles: ['user'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BotController],
      providers: [
        {
          provide: BotService,
          useValue: mockBotService,
        },
      ],
    }).compile();

    controller = module.get<BotController>(BotController);
    botService = module.get<BotService>(BotService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllBots', () => {
    it('should return all bots', async () => {
      const mockBots = [
        { id: 1, name: 'Bot 1', description: 'Description 1' },
        { id: 2, name: 'Bot 2', description: 'Description 2' },
      ];

      mockBotService.findAll.mockResolvedValue(mockBots);

      const result = await controller.getAllBots(mockUser);

      expect(result).toEqual(mockBots);
      expect(botService.findAll).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw HttpException on service error', async () => {
      const error = new HttpException(
        'Service error',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      mockBotService.findAll.mockRejectedValue(error);

      await expect(controller.getAllBots(mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.getAllBots(mockUser)).rejects.toThrow(
        'Service error'
      );
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Unknown error');
      mockBotService.findAll.mockRejectedValue(error);

      await expect(controller.getAllBots(mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.getAllBots(mockUser)).rejects.toThrow(
        'Unknown error'
      );
    });
  });

  describe('getBot', () => {
    it('should return a bot by id', async () => {
      const botId = 1;
      const mockBot = {
        id: botId,
        name: 'Test Bot',
        description: 'Test Description',
      };

      mockBotService.findById.mockResolvedValue(mockBot);

      const result = await controller.getBot(botId, mockUser);

      expect(result).toEqual(mockBot);
      expect(botService.findById).toHaveBeenCalledWith(botId, mockUser.id);
    });

    it('should throw HttpException on service error', async () => {
      const botId = 1;
      const error = new HttpException('Bot not found', HttpStatus.NOT_FOUND);
      mockBotService.findById.mockRejectedValue(error);

      await expect(controller.getBot(botId, mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.getBot(botId, mockUser)).rejects.toThrow(
        'Bot not found'
      );
    });
  });

  describe('createBot', () => {
    it('should create a new bot', async () => {
      const createDto = {
        name: 'New Bot',
        description: 'New Description',
        configs: {
          temperature: 0.7,
          system_prompt: 'You are helpful',
        },
      };
      const mockBot = { id: 1, ...createDto };

      mockBotService.create.mockResolvedValue(mockBot);

      const result = await controller.createBot(createDto, mockUser);

      expect(result).toEqual(mockBot);
      expect(botService.create).toHaveBeenCalledWith(
        mockUser.id,
        createDto.name,
        createDto.description,
        expect.objectContaining({
          temperature: createDto.configs.temperature,
          system_prompt: createDto.configs.system_prompt,
        })
      );
    });

    it('should create a bot without configs', async () => {
      const createDto = {
        name: 'New Bot',
        description: 'New Description',
      };
      const mockBot = { id: 1, ...createDto };

      mockBotService.create.mockResolvedValue(mockBot);

      const result = await controller.createBot(createDto, mockUser);

      expect(result).toEqual(mockBot);
      expect(botService.create).toHaveBeenCalledWith(
        mockUser.id,
        createDto.name,
        createDto.description,
        undefined
      );
    });

    it('should throw HttpException on service error', async () => {
      const createDto = { name: 'New Bot' };
      const error = new HttpException(
        'Bot name already exists',
        HttpStatus.CONFLICT
      );
      mockBotService.create.mockRejectedValue(error);

      await expect(controller.createBot(createDto, mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.createBot(createDto, mockUser)).rejects.toThrow(
        'Bot name already exists'
      );
    });
  });

  describe('updateBot', () => {
    it('should update a bot', async () => {
      const botId = 1;
      const updateDto = {
        name: 'Updated Bot',
        description: 'Updated Description',
        configs: {
          temperature: 0.8,
        },
      };
      const mockBot = { id: botId, ...updateDto };

      mockBotService.update.mockResolvedValue(mockBot);

      const result = await controller.updateBot(botId, updateDto, mockUser);

      expect(result).toEqual(mockBot);
      expect(botService.update).toHaveBeenCalledWith(
        botId,
        mockUser.id,
        updateDto.name,
        updateDto.description,
        expect.objectContaining({
          temperature: updateDto.configs.temperature,
        })
      );
    });

    it('should throw HttpException on service error', async () => {
      const botId = 1;
      const updateDto = { name: 'Updated Bot' };
      const error = new HttpException('Bot not found', HttpStatus.NOT_FOUND);
      mockBotService.update.mockRejectedValue(error);

      await expect(
        controller.updateBot(botId, updateDto, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.updateBot(botId, updateDto, mockUser)
      ).rejects.toThrow('Bot not found');
    });
  });

  describe('deleteBot', () => {
    it('should delete a bot', async () => {
      const botId = 1;

      mockBotService.delete.mockResolvedValue(undefined);

      const result = await controller.deleteBot(botId, mockUser);

      expect(result).toEqual({ success: true });
      expect(botService.delete).toHaveBeenCalledWith(botId, mockUser.id);
    });

    it('should throw HttpException on service error', async () => {
      const botId = 1;
      const error = new HttpException('Bot not found', HttpStatus.NOT_FOUND);
      mockBotService.delete.mockRejectedValue(error);

      await expect(controller.deleteBot(botId, mockUser)).rejects.toThrow(
        HttpException
      );
      await expect(controller.deleteBot(botId, mockUser)).rejects.toThrow(
        'Bot not found'
      );
    });
  });
});
