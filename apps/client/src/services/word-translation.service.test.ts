import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { WordTranslationService } from './word-translation.service';
import { API_BASE_URL } from '../constants/api.constants';

describe('WordTranslationService', () => {
  describe('getWordTranslations', () => {
    it('should get word translations for a message successfully', async () => {
      const mockWordTranslations = {
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
        http.get(`${API_BASE_URL}/api/messages/1/word-translations`, () => {
          return HttpResponse.json(mockWordTranslations);
        })
      );

      const result = await WordTranslationService.getWordTranslations(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        originalWord: 'Hola',
        translation: 'Hello',
      });
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/messages/1/word-translations`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(
        WordTranslationService.getWordTranslations(1)
      ).rejects.toThrow();
    });
  });

  describe('getMessageTranslations', () => {
    it('should get both translation and word translations successfully', async () => {
      const mockResponse = {
        translation: 'Hello, how are you?',
        wordTranslations: [
          {
            originalWord: 'Hola',
            translation: 'Hello',
            sentenceContext: 'Hola, ¿cómo estás?',
          },
        ],
      };

      server.use(
        http.get(`${API_BASE_URL}/api/messages/1/translations`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await WordTranslationService.getMessageTranslations(1);

      expect(result.translation).toBe('Hello, how are you?');
      expect(result.wordTranslations).toHaveLength(1);
      expect(result.wordTranslations[0]).toMatchObject({
        originalWord: 'Hola',
        translation: 'Hello',
      });
    });

    it('should handle response without translation', async () => {
      const mockResponse = {
        wordTranslations: [],
      };

      server.use(
        http.get(`${API_BASE_URL}/api/messages/1/translations`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await WordTranslationService.getMessageTranslations(1);

      expect(result.translation).toBeUndefined();
      expect(result.wordTranslations).toEqual([]);
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/messages/1/translations`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(
        WordTranslationService.getMessageTranslations(1)
      ).rejects.toThrow();
    });
  });
});
