import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 64; // 512 bits
  private readonly tagLength = 16; // 128 bits
  private readonly tagPosition = this.saltLength + this.ivLength;
  private readonly encryptedPosition = this.tagPosition + this.tagLength;

  /**
   * Get encryption key from environment variable or generate a default one
   * In production, this should be a strong, randomly generated key stored securely
   */
  private getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required. Generate a 32-byte key using: openssl rand -base64 32'
      );
    }
    // Use the key directly if it's base64 encoded, or derive from it
    const keyBuffer = Buffer.from(key, 'base64');
    if (keyBuffer.length !== this.keyLength) {
      throw new Error(
        `ENCRYPTION_KEY must be exactly ${this.keyLength} bytes (base64 encoded)`
      );
    }
    return keyBuffer;
  }

  /**
   * Encrypt a plaintext string
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Plaintext cannot be empty');
    }

    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);

    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    cipher.setAAD(salt);

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const tag = cipher.getAuthTag();

    // Combine: salt + iv + tag + encrypted
    const result = Buffer.concat([salt, iv, tag, encrypted]);
    return result.toString('base64');
  }

  /**
   * Decrypt an encrypted string
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) {
      throw new Error('Encrypted data cannot be empty');
    }

    const key = this.getEncryptionKey();
    const data = Buffer.from(encryptedData, 'base64');

    if (data.length < this.encryptedPosition) {
      throw new Error('Invalid encrypted data format');
    }

    const salt = data.subarray(0, this.saltLength);
    const iv = data.subarray(this.saltLength, this.tagPosition);
    const tag = data.subarray(this.tagPosition, this.encryptedPosition);
    const encrypted = data.subarray(this.encryptedPosition);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAAD(salt);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }
}
