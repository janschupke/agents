import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { TranslationService } from './translation.service';
import { API_BASE_URL } from '../constants/api.constants';

describe('TranslationService', () => {
  describe('translateMessage', () => {
    it('should translate a message successfully', async () => {
      const mockTranslation = {
        translation: 'Hello, how are you?',
      };

      server.use(
        http.post(`${API_BASE_URL}/api/messages/1/translate`, () => {
          return HttpResponse.json(mockTranslation);
        })
      );

      const result = await TranslationService.translateMessage(1);

      expect(result).toBe('Hello, how are you?');
    });

    it('should throw error when translation fails', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/messages/1/translate`, () => {
          return HttpResponse.json(
            { message: 'Translation failed' },
            { status: 500 }
          );
        })
      );

      await expect(TranslationService.translateMessage(1)).rejects.toThrow();
    });
  });

  describe('translateMessageWithWords', () => {
    it('should translate a message with word translations successfully', async () => {
      const mockResponse = {
        translation: 'Hello, how are you?',
        wordTranslations: [
          {
            originalWord: 'Hola',
            translation: 'Hello',
            sentenceContext: 'Hola, ¿cómo estás?',
          },
          {
            originalWord: 'cómo',
            translation: 'how',
            sentenceContext: 'Hola, ¿cómo estás?',
          },
        ],
      };

      server.use(
        http.post(`${API_BASE_URL}/api/messages/1/translate-with-words`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await TranslationService.translateMessageWithWords(1);

      expect(result.translation).toBe('Hello, how are you?');
      expect(result.wordTranslations).toHaveLength(2);
      expect(result.wordTranslations[0]).toMatchObject({
        originalWord: 'Hola',
        translation: 'Hello',
      });
    });

    it('should throw error when translation with words fails', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/messages/1/translate-with-words`, () => {
          return HttpResponse.json(
            { message: 'Translation failed' },
            { status: 500 }
          );
        })
      );

      await expect(
        TranslationService.translateMessageWithWords(1)
      ).rejects.toThrow();
    });
  });

  describe('getTranslations', () => {
    it('should get translations for multiple messages successfully', async () => {
      const mockTranslations = {
        1: 'Hello',
        2: 'How are you?',
        3: 'Goodbye',
      };

      server.use(
        http.get(`${API_BASE_URL}/api/messages/translations`, ({ request }) => {
          const url = new URL(request.url);
          const messageIds =
            url.searchParams.get('messageIds')?.split(',') || [];
          const result: Record<number, string> = {};
          messageIds.forEach((id) => {
            result[Number(id)] =
              mockTranslations[Number(id) as keyof typeof mockTranslations] ||
              '';
          });
          return HttpResponse.json(result);
        })
      );

      const result = await TranslationService.getTranslations([1, 2, 3]);

      expect(result).toMatchObject({
        1: 'Hello',
        2: 'How are you?',
        3: 'Goodbye',
      });
    });

    it('should return empty object when messageIds array is empty', async () => {
      const result = await TranslationService.getTranslations([]);

      expect(result).toEqual({});
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/messages/translations`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(
        TranslationService.getTranslations([1, 2, 3])
      ).rejects.toThrow();
    });
  });
});
