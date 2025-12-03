import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { AgentService } from './agent.service';
import { CreateAgentRequest, UpdateAgentRequest } from '../../types/chat.types';
import { API_BASE_URL } from '../../constants/api.constants';

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
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(AgentService.getAllAgents()).rejects.toThrow();
    });
  });

  describe('getAgent', () => {
    it('should fetch an agent by ID successfully', async () => {
      const result = await AgentService.getAgent(1);

      expect(result).toMatchObject({
        id: 1,
        name: 'Test Agent 1',
        description: 'Test Description 1',
      });
    });

    it('should throw error when agent not found', async () => {
      server.use(
        http.get(`${API_BASE_URL}/api/agents/999`, () => {
          return HttpResponse.json(
            { message: 'Agent not found' },
            { status: 404 }
          );
        })
      );

      await expect(AgentService.getAgent(999)).rejects.toThrow();
    });
  });

  describe('createAgent', () => {
    it('should create a new agent successfully', async () => {
      const createData: CreateAgentRequest = {
        name: 'New Agent',
        description: 'New Description',
        configs: {
          temperature: 0.7,
          system_prompt: 'You are a helpful assistant',
          behavior_rules: ['Be polite', 'Be concise'],
        },
      };

      const result = await AgentService.createAgent(createData);

      expect(result).toMatchObject({
        name: 'New Agent',
        description: 'New Description',
      });
      expect(result.id).toBeGreaterThan(0);
    });

    it('should throw error when creation fails', async () => {
      const createData: CreateAgentRequest = {
        name: 'New Agent',
      };

      server.use(
        http.post(`${API_BASE_URL}/api/agents`, () => {
          return HttpResponse.json(
            { message: 'Validation error' },
            { status: 400 }
          );
        })
      );

      await expect(AgentService.createAgent(createData)).rejects.toThrow();
    });
  });

  describe('updateAgent', () => {
    it('should update an agent successfully', async () => {
      const updateData: UpdateAgentRequest = {
        name: 'Updated Agent',
        description: 'Updated Description',
      };

      const result = await AgentService.updateAgent(1, updateData);

      expect(result).toMatchObject({
        id: 1,
        name: 'Updated Agent',
        description: 'Updated Description',
      });
    });

    it('should throw error when update fails', async () => {
      const updateData: UpdateAgentRequest = {
        name: 'Updated Agent',
      };

      server.use(
        http.put(`${API_BASE_URL}/api/agents/999`, () => {
          return HttpResponse.json(
            { message: 'Agent not found' },
            { status: 404 }
          );
        })
      );

      await expect(AgentService.updateAgent(999, updateData)).rejects.toThrow();
    });
  });
});
