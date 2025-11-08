import { Test, TestingModule } from '@nestjs/testing';
import { HealthcheckService } from './healthcheck.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthcheckService', () => {
  let service: HealthcheckService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    bot: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthcheckService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthcheckService>(HealthcheckService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return health check status with bots', async () => {
      const mockBots = [
        { id: 1, name: 'Test Bot', description: 'Test Description' },
      ];
      mockPrismaService.bot.findMany.mockResolvedValue(mockBots);

      const result = await service.check();

      expect(result).toEqual({
        status: 'ok',
        message: 'Health check successful',
        bots: mockBots,
      });
      expect(prismaService.bot.findMany).toHaveBeenCalledWith({ take: 10 });
    });

    it('should throw HttpException on database error', async () => {
      const error = new Error('Database connection failed');
      mockPrismaService.bot.findMany.mockRejectedValue(error);

      await expect(service.check()).rejects.toThrow();
    });
  });
});
