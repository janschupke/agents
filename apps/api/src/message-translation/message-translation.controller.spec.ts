import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { MessageTranslationController } from './message-translation.controller';
import { MessageTranslationService } from './message-translation.service';
import { WordTranslationService } from './word-translation.service';
import { MessageRepository } from '../message/message.repository';
import { SessionRepository } from '../session/session.repository';
import { ERROR_MESSAGES } from '../common/constants/error-messages.constants.js';

describe('MessageTranslationController', () => {
  let controller: MessageTranslationController;
  let translationService: jest.Mocked<MessageTranslationService>;
  let wordTranslationService: jest.Mocked<WordTranslationService>;
  let messageRepository: jest.Mocked<MessageRepository>;
  let sessionRepository: jest.Mocked<SessionRepository>;

  const mockTranslationService = {
    translateMessage: jest.fn(),
    translateMessageWithWords: jest.fn(),
    getTranslationsForMessages: jest.fn(),
  };

  const mockWordTranslationService = {
    getWordTranslationsForMessage: jest.fn(),
  };

  const mockMessageRepository = {
    findById: jest.fn(),
  };

  const mockSessionRepository = {
    findByIdAndUserId: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    imageUrl: null,
    roles: ['user'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageTranslationController],
      providers: [
        {
          provide: MessageTranslationService,
          useValue: mockTranslationService,
        },
        {
          provide: WordTranslationService,
          useValue: mockWordTranslationService,
        },
        {
          provide: MessageRepository,
          useValue: mockMessageRepository,
        },
        {
          provide: SessionRepository,
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    controller = module.get<MessageTranslationController>(
      MessageTranslationController
    );
    translationService = module.get(MessageTranslationService);
    wordTranslationService = module.get(WordTranslationService);
    messageRepository = module.get(MessageRepository);
    sessionRepository = module.get(SessionRepository);

    jest.clearAllMocks();
  });

  describe('translateMessage', () => {
    it('should translate message', async () => {
      const messageId = 1;
      const translation = { translation: 'Hello' };

      translationService.translateMessage.mockResolvedValue(translation);

      const result = await controller.translateMessage(messageId, mockUser);

      expect(result).toEqual(translation);
      expect(translationService.translateMessage).toHaveBeenCalledWith(
        messageId,
        'user-1'
      );
    });
  });

  describe('translateMessageWithWords', () => {
    it('should translate message with words', async () => {
      const messageId = 1;
      const result = {
        translation: 'Hello',
        wordTranslations: [
          {
            originalWord: 'Bonjour',
            translation: 'Hello',
            sentenceContext: 'Bonjour',
          },
        ],
      };

      translationService.translateMessageWithWords.mockResolvedValue(result);

      const response = await controller.translateMessageWithWords(
        messageId,
        mockUser
      );

      expect(response).toEqual(result);
      expect(translationService.translateMessageWithWords).toHaveBeenCalledWith(
        messageId,
        'user-1'
      );
    });
  });

  describe('getTranslations', () => {
    it('should return translations for message IDs', async () => {
      const messageIds = '1,2,3';
      const translationsMap = new Map([
        [1, 'Translation 1'],
        [2, 'Translation 2'],
        [3, 'Translation 3'],
      ]);

      translationService.getTranslationsForMessages.mockResolvedValue(
        translationsMap
      );

      const result = await controller.getTranslations(messageIds, mockUser);

      expect(result).toEqual({
        1: 'Translation 1',
        2: 'Translation 2',
        3: 'Translation 3',
      });
      expect(
        translationService.getTranslationsForMessages
      ).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should filter out invalid IDs', async () => {
      const messageIds = '1,invalid,2';
      const translationsMap = new Map([
        [1, 'Translation 1'],
        [2, 'Translation 2'],
      ]);

      translationService.getTranslationsForMessages.mockResolvedValue(
        translationsMap
      );

      const result = await controller.getTranslations(messageIds, mockUser);

      expect(result).toEqual({
        1: 'Translation 1',
        2: 'Translation 2',
      });
      expect(
        translationService.getTranslationsForMessages
      ).toHaveBeenCalledWith([1, 2]);
    });
  });

  describe('getWordTranslations', () => {
    it('should return word translations for message', async () => {
      const messageId = 1;
      const message = {
        id: messageId,
        sessionId: 1,
        role: 'assistant',
        content: 'Bonjour',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };
      const session = {
        id: 1,
        userId: 'user-1',
        agentId: 1,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const wordTranslations = [
        {
          id: 1,
          messageId,
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour',
          createdAt: new Date(),
        },
      ];

      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(session);
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        wordTranslations
      );

      const result = await controller.getWordTranslations(messageId, mockUser);

      expect(result).toEqual({ wordTranslations });
      expect(messageRepository.findById).toHaveBeenCalledWith(messageId);
      expect(sessionRepository.findByIdAndUserId).toHaveBeenCalledWith(
        1,
        'user-1'
      );
    });

    it('should throw error if message not found', async () => {
      const messageId = 1;

      messageRepository.findById.mockResolvedValue(null);

      await expect(
        controller.getWordTranslations(messageId, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.getWordTranslations(messageId, mockUser)
      ).rejects.toThrow(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    });

    it('should throw error if session access denied', async () => {
      const messageId = 1;
      const message = {
        id: messageId,
        sessionId: 1,
        role: 'assistant',
        content: 'Bonjour',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };

      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(
        controller.getWordTranslations(messageId, mockUser)
      ).rejects.toThrow(HttpException);
      await expect(
        controller.getWordTranslations(messageId, mockUser)
      ).rejects.toThrow(ERROR_MESSAGES.ACCESS_DENIED);
    });
  });

  describe('getMessageTranslations', () => {
    it('should return both translation and word translations', async () => {
      const messageId = 1;
      const message = {
        id: messageId,
        sessionId: 1,
        role: 'assistant',
        content: 'Bonjour',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };
      const session = {
        id: 1,
        userId: 'user-1',
        agentId: 1,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const translationsMap = new Map([[messageId, 'Hello']]);
      const wordTranslations = [
        {
          id: 1,
          messageId,
          originalWord: 'Bonjour',
          translation: 'Hello',
          sentenceContext: 'Bonjour',
          createdAt: new Date(),
        },
      ];

      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(session);
      translationService.getTranslationsForMessages.mockResolvedValue(
        translationsMap
      );
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        wordTranslations
      );

      const result = await controller.getMessageTranslations(
        messageId,
        mockUser
      );

      expect(result).toEqual({
        translation: 'Hello',
        wordTranslations,
      });
    });

    it('should return undefined translation if not found', async () => {
      const messageId = 1;
      const message = {
        id: messageId,
        sessionId: 1,
        role: 'assistant',
        content: 'Bonjour',
        metadata: null,
        rawRequest: null,
        rawResponse: null,
        createdAt: new Date(),
      };
      const session = {
        id: 1,
        userId: 'user-1',
        agentId: 1,
        sessionName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const translationsMap = new Map();
      const wordTranslations: Array<{
        id: number;
        messageId: number;
        originalWord: string;
        translation: string;
        sentenceContext: string;
        createdAt: Date;
      }> = [];

      messageRepository.findById.mockResolvedValue(message);
      sessionRepository.findByIdAndUserId.mockResolvedValue(session);
      translationService.getTranslationsForMessages.mockResolvedValue(
        translationsMap
      );
      wordTranslationService.getWordTranslationsForMessage.mockResolvedValue(
        wordTranslations
      );

      const result = await controller.getMessageTranslations(
        messageId,
        mockUser
      );

      expect(result).toEqual({
        translation: undefined,
        wordTranslations: [],
      });
    });
  });
});
