import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ApiCredentialsRepository } from './repository/api-credentials.repository';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class ApiCredentialsService {
  constructor(
    private readonly repository: ApiCredentialsRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async setApiKey(userId: string, provider: string, apiKey: string): Promise<void> {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new HttpException('API key cannot be empty', HttpStatus.BAD_REQUEST);
    }

    try {
      const encryptedKey = this.encryptionService.encrypt(apiKey);
      await this.repository.create(userId, provider, encryptedKey);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const err = error as { message?: string };
      throw new HttpException(
        `Failed to save API key: ${err.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getApiKey(userId: string, provider: string): Promise<string | null> {
    const credential = await this.repository.findByUserIdAndProvider(userId, provider);
    if (!credential) {
      return null;
    }

    try {
      const decryptedKey = this.encryptionService.decrypt(credential.encryptedKey);
      // Update last used timestamp
      await this.repository.updateLastUsedAt(userId, provider);
      return decryptedKey;
    } catch (error) {
      const err = error as { message?: string };
      throw new HttpException(
        `Failed to decrypt API key: ${err.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async hasApiKey(userId: string, provider: string): Promise<boolean> {
    return this.repository.hasCredential(userId, provider);
  }

  async deleteApiKey(userId: string, provider: string): Promise<void> {
    const credential = await this.repository.findByUserIdAndProvider(userId, provider);
    if (!credential) {
      throw new HttpException('API key not found', HttpStatus.NOT_FOUND);
    }

    await this.repository.delete(userId, provider);
  }

  async getCredentialsStatus(userId: string): Promise<{ provider: string; hasKey: boolean }[]> {
    const credentials = await this.repository.findByUserId(userId);
    const providers = ['openai']; // Add more providers as needed
    
    return providers.map((provider) => {
      const hasKey = credentials.some((c) => c.provider === provider);
      return { provider, hasKey };
    });
  }
}
