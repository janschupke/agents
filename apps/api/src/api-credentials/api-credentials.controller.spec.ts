import { Test, TestingModule } from '@nestjs/testing';
import { ApiCredentialsController } from './api-credentials.controller';
import { ApiCredentialsService } from './api-credentials.service';
import { AuthenticatedUser } from '../common/types/auth.types';
import { MAGIC_STRINGS } from '../common/constants/error-messages.constants.js';

describe('ApiCredentialsController', () => {
  let controller: ApiCredentialsController;
  let apiCredentialsService: jest.Mocked<ApiCredentialsService>;

  const mockApiCredentialsService = {
    getCredentialsStatus: jest.fn(),
    setApiKey: jest.fn(),
    deleteApiKey: jest.fn(),
    hasApiKey: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    imageUrl: null,
    roles: ['user'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiCredentialsController],
      providers: [
        {
          provide: ApiCredentialsService,
          useValue: mockApiCredentialsService,
        },
      ],
    }).compile();

    controller = module.get<ApiCredentialsController>(ApiCredentialsController);
    apiCredentialsService = module.get(ApiCredentialsService);

    jest.clearAllMocks();
  });

  describe('getCredentialsStatus', () => {
    it('should return credentials status', async () => {
      const credentials = [{ provider: 'openai', hasKey: true }];

      apiCredentialsService.getCredentialsStatus.mockResolvedValue(credentials);

      const result = await controller.getCredentialsStatus(mockUser);

      expect(result).toEqual({ credentials });
      expect(apiCredentialsService.getCredentialsStatus).toHaveBeenCalledWith(
        'user-1'
      );
    });
  });

  describe('setOpenAIKey', () => {
    it('should set OpenAI API key', async () => {
      const dto = { apiKey: 'sk-test-key' };

      apiCredentialsService.setApiKey.mockResolvedValue(undefined);

      const result = await controller.setOpenAIKey(mockUser, dto);

      expect(result).toEqual({ success: true });
      expect(apiCredentialsService.setApiKey).toHaveBeenCalledWith(
        'user-1',
        MAGIC_STRINGS.OPENAI_PROVIDER,
        'sk-test-key'
      );
    });
  });

  describe('deleteOpenAIKey', () => {
    it('should delete OpenAI API key', async () => {
      apiCredentialsService.deleteApiKey.mockResolvedValue(undefined);

      const result = await controller.deleteOpenAIKey(mockUser);

      expect(result).toEqual({ success: true });
      expect(apiCredentialsService.deleteApiKey).toHaveBeenCalledWith(
        'user-1',
        MAGIC_STRINGS.OPENAI_PROVIDER
      );
    });
  });

  describe('checkOpenAIKey', () => {
    it('should return true if API key exists', async () => {
      apiCredentialsService.hasApiKey.mockResolvedValue(true);

      const result = await controller.checkOpenAIKey(mockUser);

      expect(result).toEqual({ hasKey: true });
      expect(apiCredentialsService.hasApiKey).toHaveBeenCalledWith(
        'user-1',
        MAGIC_STRINGS.OPENAI_PROVIDER
      );
    });

    it('should return false if API key does not exist', async () => {
      apiCredentialsService.hasApiKey.mockResolvedValue(false);

      const result = await controller.checkOpenAIKey(mockUser);

      expect(result).toEqual({ hasKey: false });
    });
  });
});
