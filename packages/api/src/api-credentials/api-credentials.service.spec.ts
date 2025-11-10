import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiCredentialsService } from './api-credentials.service';
import { ApiCredentialsRepository } from './api-credentials.repository';
import { EncryptionService } from '../common/services/encryption.service';

describe('ApiCredentialsService', () => {
  let service: ApiCredentialsService;
  let repository: ApiCredentialsRepository;
  let encryptionService: EncryptionService;

  const mockRepository = {
    create: jest.fn(),
    findByUserIdAndProvider: jest.fn(),
    updateLastUsedAt: jest.fn(),
    hasCredential: jest.fn(),
    delete: jest.fn(),
    findByUserId: jest.fn(),
  };

  const mockEncryptionService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiCredentialsService,
        {
          provide: ApiCredentialsRepository,
          useValue: mockRepository,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<ApiCredentialsService>(ApiCredentialsService);
    repository = module.get<ApiCredentialsRepository>(ApiCredentialsRepository);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setApiKey', () => {
    it('should set an API key', async () => {
      const userId = 'user-123';
      const provider = 'openai';
      const apiKey = 'test-api-key';
      const encryptedKey = 'encrypted-key';

      mockEncryptionService.encrypt.mockReturnValue(encryptedKey);
      mockRepository.create.mockResolvedValue(undefined);

      await service.setApiKey(userId, provider, apiKey);

      expect(encryptionService.encrypt).toHaveBeenCalledWith(apiKey);
      expect(repository.create).toHaveBeenCalledWith(userId, provider, encryptedKey);
    });

    it('should throw HttpException if API key is empty', async () => {
      const userId = 'user-123';
      const provider = 'openai';
      const apiKey = '';

      await expect(service.setApiKey(userId, provider, apiKey)).rejects.toThrow(HttpException);
      await expect(service.setApiKey(userId, provider, apiKey)).rejects.toThrow(
        'API key cannot be empty',
      );
    });

    it('should throw HttpException if API key is only whitespace', async () => {
      const userId = 'user-123';
      const provider = 'openai';
      const apiKey = '   ';

      await expect(service.setApiKey(userId, provider, apiKey)).rejects.toThrow(HttpException);
      await expect(service.setApiKey(userId, provider, apiKey)).rejects.toThrow(
        'API key cannot be empty',
      );
    });

    it('should throw HttpException if encryption fails', async () => {
      const userId = 'user-123';
      const provider = 'openai';
      const apiKey = 'test-api-key';
      const error = new Error('Encryption failed');

      mockEncryptionService.encrypt.mockImplementation(() => {
        throw error;
      });

      await expect(service.setApiKey(userId, provider, apiKey)).rejects.toThrow(HttpException);
      await expect(service.setApiKey(userId, provider, apiKey)).rejects.toThrow(
        'Failed to save API key: Encryption failed',
      );
    });

    it('should rethrow HttpException from repository', async () => {
      const userId = 'user-123';
      const provider = 'openai';
      const apiKey = 'test-api-key';
      const encryptedKey = 'encrypted-key';
      const httpException = new HttpException('Repository error', HttpStatus.CONFLICT);

      mockEncryptionService.encrypt.mockReturnValue(encryptedKey);
      mockRepository.create.mockRejectedValue(httpException);

      await expect(service.setApiKey(userId, provider, apiKey)).rejects.toThrow(HttpException);
      await expect(service.setApiKey(userId, provider, apiKey)).rejects.toThrow('Repository error');
    });
  });

  describe('getApiKey', () => {
    it('should return decrypted API key', async () => {
      const userId = 'user-123';
      const provider = 'openai';
      const encryptedKey = 'encrypted-key';
      const decryptedKey = 'test-api-key';
      const mockCredential = {
        id: 1,
        userId,
        provider,
        encryptedKey,
        createdAt: new Date(),
        lastUsedAt: null,
      };

      mockRepository.findByUserIdAndProvider.mockResolvedValue(mockCredential);
      mockEncryptionService.decrypt.mockReturnValue(decryptedKey);
      mockRepository.updateLastUsedAt.mockResolvedValue(undefined);

      const result = await service.getApiKey(userId, provider);

      expect(result).toBe(decryptedKey);
      expect(repository.findByUserIdAndProvider).toHaveBeenCalledWith(userId, provider);
      expect(encryptionService.decrypt).toHaveBeenCalledWith(encryptedKey);
      expect(repository.updateLastUsedAt).toHaveBeenCalledWith(userId, provider);
    });

    it('should return null if credential not found', async () => {
      const userId = 'user-123';
      const provider = 'openai';

      mockRepository.findByUserIdAndProvider.mockResolvedValue(null);

      const result = await service.getApiKey(userId, provider);

      expect(result).toBeNull();
      expect(encryptionService.decrypt).not.toHaveBeenCalled();
    });

    it('should throw HttpException if decryption fails', async () => {
      const userId = 'user-123';
      const provider = 'openai';
      const encryptedKey = 'encrypted-key';
      const mockCredential = {
        id: 1,
        userId,
        provider,
        encryptedKey,
        createdAt: new Date(),
        lastUsedAt: null,
      };
      const error = new Error('Decryption failed');

      mockRepository.findByUserIdAndProvider.mockResolvedValue(mockCredential);
      mockEncryptionService.decrypt.mockImplementation(() => {
        throw error;
      });

      await expect(service.getApiKey(userId, provider)).rejects.toThrow(HttpException);
      await expect(service.getApiKey(userId, provider)).rejects.toThrow(
        'Failed to decrypt API key: Decryption failed',
      );
    });
  });

  describe('hasApiKey', () => {
    it('should return true if credential exists', async () => {
      const userId = 'user-123';
      const provider = 'openai';

      mockRepository.hasCredential.mockResolvedValue(true);

      const result = await service.hasApiKey(userId, provider);

      expect(result).toBe(true);
      expect(repository.hasCredential).toHaveBeenCalledWith(userId, provider);
    });

    it('should return false if credential does not exist', async () => {
      const userId = 'user-123';
      const provider = 'openai';

      mockRepository.hasCredential.mockResolvedValue(false);

      const result = await service.hasApiKey(userId, provider);

      expect(result).toBe(false);
      expect(repository.hasCredential).toHaveBeenCalledWith(userId, provider);
    });
  });

  describe('deleteApiKey', () => {
    it('should delete an API key', async () => {
      const userId = 'user-123';
      const provider = 'openai';
      const mockCredential = {
        id: 1,
        userId,
        provider,
        encryptedKey: 'encrypted-key',
        createdAt: new Date(),
        lastUsedAt: null,
      };

      mockRepository.findByUserIdAndProvider.mockResolvedValue(mockCredential);
      mockRepository.delete.mockResolvedValue(undefined);

      await service.deleteApiKey(userId, provider);

      expect(repository.findByUserIdAndProvider).toHaveBeenCalledWith(userId, provider);
      expect(repository.delete).toHaveBeenCalledWith(userId, provider);
    });

    it('should throw HttpException if credential not found', async () => {
      const userId = 'user-123';
      const provider = 'openai';

      mockRepository.findByUserIdAndProvider.mockResolvedValue(null);

      await expect(service.deleteApiKey(userId, provider)).rejects.toThrow(HttpException);
      await expect(service.deleteApiKey(userId, provider)).rejects.toThrow('API key not found');
    });
  });

  describe('getCredentialsStatus', () => {
    it('should return credentials status', async () => {
      const userId = 'user-123';
      const mockCredentials = [
        {
          id: 1,
          userId,
          provider: 'openai',
          encryptedKey: 'encrypted-key',
          createdAt: new Date(),
          lastUsedAt: null,
        },
      ];

      mockRepository.findByUserId.mockResolvedValue(mockCredentials);

      const result = await service.getCredentialsStatus(userId);

      expect(result).toEqual([
        { provider: 'openai', hasKey: true },
      ]);
      expect(repository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return hasKey false if credential does not exist', async () => {
      const userId = 'user-123';

      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getCredentialsStatus(userId);

      expect(result).toEqual([
        { provider: 'openai', hasKey: false },
      ]);
    });
  });
});
