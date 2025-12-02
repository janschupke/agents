import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ApiCredentialsRepository } from './api-credentials.repository';
import { EncryptionService } from '../common/services/encryption.service';
import { ApiCredentialsStatus } from '../common/interfaces/api-credentials.interface';
import { MAGIC_STRINGS, ERROR_MESSAGES } from '../common/constants/error-messages.constants.js';

@Injectable()
export class ApiCredentialsService {
  constructor(
    private readonly repository: ApiCredentialsRepository,
    private readonly encryptionService: EncryptionService
  ) {}

  async setApiKey(
    userId: string,
    provider: string,
    apiKey: string
  ): Promise<void> {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new HttpException(
        ERROR_MESSAGES.API_KEY_CANNOT_BE_EMPTY,
        HttpStatus.BAD_REQUEST
      );
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
        `${ERROR_MESSAGES.FAILED_TO_SAVE_API_KEY}: ${err.message || ERROR_MESSAGES.UNKNOWN_ERROR}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getApiKey(userId: string, provider: string): Promise<string | null> {
    const credential = await this.repository.findByUserIdAndProvider(
      userId,
      provider
    );
    if (!credential) {
      return null;
    }

    try {
      const decryptedKey = this.encryptionService.decrypt(
        credential.encryptedKey
      );
      // Update last used timestamp
      await this.repository.updateLastUsedAt(userId, provider);
      return decryptedKey;
    } catch (error) {
      const err = error as { message?: string };
      throw new HttpException(
        `${ERROR_MESSAGES.FAILED_TO_DECRYPT_API_KEY}: ${err.message || ERROR_MESSAGES.UNKNOWN_ERROR}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async hasApiKey(userId: string, provider: string): Promise<boolean> {
    return this.repository.hasCredential(userId, provider);
  }

  async deleteApiKey(userId: string, provider: string): Promise<void> {
    const credential = await this.repository.findByUserIdAndProvider(
      userId,
      provider
    );
    if (!credential) {
      throw new HttpException(ERROR_MESSAGES.API_KEY_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    await this.repository.delete(userId, provider);
  }

  async getCredentialsStatus(userId: string): Promise<ApiCredentialsStatus[]> {
    const credentials = await this.repository.findByUserId(userId);
    const providers = [MAGIC_STRINGS.OPENAI_PROVIDER]; // Add more providers as needed

    return providers.map((provider) => {
      const hasKey = credentials.some((c) => c.provider === provider);
      return { provider, hasKey };
    });
  }
}
