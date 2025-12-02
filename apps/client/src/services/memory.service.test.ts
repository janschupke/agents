import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { MemoryService } from './memory.service';
import { API_BASE_URL } from '../constants/api.constants';

describe('MemoryService', () => {
  describe('getMemories', () => {
    it('should fetch all memories for an agent successfully', async () => {
      const mockMemories = [
        {
          id: 1,
          agentId: 1,
          userId: 'user_123',
          keyPoint: 'Test memory 1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          agentId: 1,
          userId: 'user_123',
          keyPoint: 'Test memory 2',
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      server.use(
        http.get(`${API_BASE_URL}/api/agents/1/memories`, () => {
          return HttpResponse.json(mockMemories);
        })
      );

      const result = await MemoryService.getMemories(1);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        agentId: 1,
        keyPoint: 'Test memory 1',
      });
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/agents/1/memories`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(MemoryService.getMemories(1)).rejects.toThrow();
    });
  });

  describe('getMemory', () => {
    it('should fetch a specific memory successfully', async () => {
      const mockMemory = {
        id: 1,
        agentId: 1,
        userId: 'user_123',
        keyPoint: 'Test memory',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      server.use(
        http.get(`${API_BASE_URL}/api/agents/1/memories/1`, () => {
          return HttpResponse.json(mockMemory);
        })
      );

      const result = await MemoryService.getMemory(1, 1);

      expect(result).toMatchObject({
        id: 1,
        agentId: 1,
        keyPoint: 'Test memory',
      });
    });

    it('should throw error when memory not found', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/agents/1/memories/999`, () => {
          return HttpResponse.json(
            { message: 'Memory not found' },
            { status: 404 }
          );
        })
      );

      await expect(MemoryService.getMemory(1, 999)).rejects.toThrow();
    });
  });

  describe('updateMemory', () => {
    it('should update a memory successfully', async () => {
      const updatedMemory = {
        id: 1,
        agentId: 1,
        userId: 'user_123',
        keyPoint: 'Updated memory',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      server.use(
        http.put(`${API_BASE_URL}/api/agents/1/memories/1`, async ({ request }) => {
          const body = (await request.json()) as { keyPoint: string };
          return HttpResponse.json({
            ...updatedMemory,
            keyPoint: body.keyPoint,
          });
        })
      );

      const result = await MemoryService.updateMemory(1, 1, 'Updated memory');

      expect(result).toMatchObject({
        id: 1,
        keyPoint: 'Updated memory',
      });
    });

    it('should throw error when update fails', async () => {
      server.use(
        http.put(`${API_BASE_URL}/api/agents/1/memories/999`, () => {
          return HttpResponse.json(
            { message: 'Memory not found' },
            { status: 404 }
          );
        })
      );

      await expect(
        MemoryService.updateMemory(1, 999, 'Updated memory')
      ).rejects.toThrow();
    });
  });

  describe('deleteMemory', () => {
    it('should delete a memory successfully', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/api/agents/1/memories/1`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await expect(MemoryService.deleteMemory(1, 1)).resolves.not.toThrow();
    });

    it('should throw error when delete fails', async () => {
      server.use(
        http.delete(`${API_BASE_URL}/api/agents/1/memories/999`, () => {
          return HttpResponse.json(
            { message: 'Memory not found' },
            { status: 404 }
          );
        })
      );

      await expect(MemoryService.deleteMemory(1, 999)).rejects.toThrow();
    });
  });

  describe('summarizeMemories', () => {
    it('should trigger memory summarization successfully', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/agents/1/memories/summarize`, () => {
          return HttpResponse.json({ success: true });
        })
      );

      await expect(MemoryService.summarizeMemories(1)).resolves.not.toThrow();
    });

    it('should throw error when summarization fails', async () => {
      server.use(
        http.post(`${API_BASE_URL}/api/agents/1/memories/summarize`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(MemoryService.summarizeMemories(1)).rejects.toThrow();
    });
  });
});
