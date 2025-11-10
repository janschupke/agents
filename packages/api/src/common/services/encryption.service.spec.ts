import { Test, TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;

  // Generate a valid 32-byte key for testing
  const validKey = Buffer.alloc(32, 1).toString('base64');

  beforeEach(async () => {
    // Set a valid encryption key for testing
    process.env.ENCRYPTION_KEY = validKey;

    const module: TestingModule = await Test.createTestingModule({
      providers: [EncryptionService],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt', () => {
    it('should encrypt a plaintext string', () => {
      const plaintext = 'test message';
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
      // Encrypted data should be base64 encoded
      expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
    });

    it('should produce different encrypted values for same plaintext (due to random IV)', () => {
      const plaintext = 'test message';
      const encrypted1 = service.encrypt(plaintext);
      const encrypted2 = service.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw error if plaintext is empty', () => {
      expect(() => service.encrypt('')).toThrow('Plaintext cannot be empty');
    });

    it('should throw error if ENCRYPTION_KEY is not set', () => {
      delete process.env.ENCRYPTION_KEY;
      const serviceWithoutKey = new EncryptionService();

      expect(() => serviceWithoutKey.encrypt('test')).toThrow(
        'ENCRYPTION_KEY environment variable is required',
      );
    });

    it('should throw error if ENCRYPTION_KEY has wrong length', () => {
      process.env.ENCRYPTION_KEY = Buffer.alloc(16, 1).toString('base64');
      const serviceWithWrongKey = new EncryptionService();

      expect(() => serviceWithWrongKey.encrypt('test')).toThrow(
        'ENCRYPTION_KEY must be exactly 32 bytes',
      );
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string', () => {
      const plaintext = 'test message';
      const encrypted = service.encrypt(plaintext);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt various types of messages', () => {
      const messages = [
        'simple message',
        'message with special chars: !@#$%^&*()',
        'message with unicode: 🚀',
        'very long message '.repeat(100),
        '1234567890',
      ];

      messages.forEach((message) => {
        const encrypted = service.encrypt(message);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(message);
      });
    });

    it('should throw error if encrypted data is empty', () => {
      expect(() => service.decrypt('')).toThrow('Encrypted data cannot be empty');
    });

    it('should throw error if encrypted data format is invalid', () => {
      const invalidData = 'invalid-encrypted-data';
      expect(() => service.decrypt(invalidData)).toThrow('Invalid encrypted data format');
    });

    it('should throw error if encrypted data is too short', () => {
      const shortData = Buffer.alloc(10).toString('base64');
      expect(() => service.decrypt(shortData)).toThrow('Invalid encrypted data format');
    });

    it('should throw error if decryption fails (tampered data)', () => {
      const plaintext = 'test message';
      const encrypted = service.encrypt(plaintext);
      // Tamper with the encrypted data
      const tampered = encrypted.slice(0, -5) + 'xxxxx';

      expect(() => service.decrypt(tampered)).toThrow();
    });

    it('should throw error if ENCRYPTION_KEY is not set', () => {
      const plaintext = 'test message';
      const encrypted = service.encrypt(plaintext);

      delete process.env.ENCRYPTION_KEY;
      const serviceWithoutKey = new EncryptionService();

      expect(() => serviceWithoutKey.decrypt(encrypted)).toThrow(
        'ENCRYPTION_KEY environment variable is required',
      );
    });
  });

  describe('encrypt and decrypt roundtrip', () => {
    it('should successfully encrypt and decrypt various data types', () => {
      const testCases = [
        'simple text',
        'text with\nnewlines',
        'text with\ttabs',
        'text with "quotes"',
        'text with \'single quotes\'',
        'JSON: {"key": "value"}',
        'Unicode: 你好世界 🌍',
        'Empty spaces:     ',
        'Numbers: 1234567890',
        'Special: !@#$%^&*()_+-=[]{}|;:,.<>?',
      ];

      testCases.forEach((testCase) => {
        const encrypted = service.encrypt(testCase);
        const decrypted = service.decrypt(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });
  });
});
