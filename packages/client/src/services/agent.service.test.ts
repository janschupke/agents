import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import { AgentService } from './agent.service';
import { Agent, CreateAgentRequest, UpdateAgentRequest } from '../types/chat.types';
import { API_BASE_URL } from '../constants/api.constants';

describe('AgentService', () => {

  describe('getAllAgents', () => {
    it('should fetch all agents successfully', async () => {
      const result = await AgentService.getAllAgents();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'Test Agent 1',
        description: 'Test Description 1',
      });
    });

    it('should throw error when fetch fails', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/agents`, () => {
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        })
      );

      await expect(AgentService.getAllAgents()).rejects.toThrow();
    });
