import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ApiCredentialsRepository } from './api-credentials.repository';
import { EncryptionService } from '../common/services/encryption.service';
import { ApiCredentialsStatus } from '../common/interfaces/api-credentials.interface';
import {
  MAGIC_STRINGS,
  ERROR_MESSAGES,
} from '../common/constants/error-messages.constants.js';

@Injectable()
export class ApiCredentialsService {
  private readonly logger = new Logger(ApiCredentialsService.name);

  constructor(
    private readonly repository: ApiCredentialsRepository,
    private readonly encryptionService: EncryptionService
  ) {}

  async setApiKey(
    userId: string,
    provider: string,
    apiKey: string
  ): Promise<void> {
    this.logger.log(`Setting API key for user ${userId}, provider ${provider}`);
    if (!apiKey || apiKey.trim().length === 0) {
      this.logger.warn(`Empty API key provided by user ${userId}`);
      throw new HttpException(
        ERROR_MESSAGES.API_KEY_CANNOT_BE_EMPTY,
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      const encryptedKey = this.encryptionService.encrypt(apiKey);
      await this.repository.create(userId, provider, encryptedKey);
      this.logger.log(
        `Successfully saved API key for user ${userId}, provider ${provider}`
      );
    } catch (error) {
      this.logger.error(`Failed to save API key for user ${userId}:`, error);
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
    this.logger.debug(
      `Getting API key for user ${userId}, provider ${provider}`
    );
    const credential = await this.repository.findByUserIdAndProvider(
      userId,
      provider
    );
    if (!credential) {
      this.logger.debug(
        `No API key found for user ${userId}, provider ${provider}`
      );
      return null;
    }

    try {
      const decryptedKey = this.encryptionService.decrypt(
        credential.encryptedKey
      );
      // Update last used timestamp
      await this.repository.updateLastUsedAt(userId, provider);
      this.logger.debug(
        `Successfully retrieved API key for user ${userId}, provider ${provider}`
      );
      return decryptedKey;
    } catch (error) {
      this.logger.error(`Failed to decrypt API key for user ${userId}:`, error);
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
    this.logger.log(
      `Deleting API key for user ${userId}, provider ${provider}`
    );
    const credential = await this.repository.findByUserIdAndProvider(
      userId,
      provider
    );
    if (!credential) {
      this.logger.warn(
        `API key not found for user ${userId}, provider ${provider}`
      );
      throw new HttpException(
        ERROR_MESSAGES.API_KEY_NOT_FOUND,
        HttpStatus.NOT_FOUND
      );
    }

    await this.repository.delete(userId, provider);
    this.logger.log(
      `Successfully deleted API key for user ${userId}, provider ${provider}`
    );
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
