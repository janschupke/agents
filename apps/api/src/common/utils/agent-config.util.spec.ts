import { mapAgentConfigs } from './agent-config.util';
import { AgentConfigDto } from '../dto/agent.dto';
import { ResponseLength } from '@openai/shared-types';
import { Gender } from '@openai/shared-types';
import { Sentiment } from '@openai/shared-types';
import { Availability } from '@openai/shared-types';
import { PERSONALITY_TYPES } from '@openai/shared-types';

describe('mapAgentConfigs', () => {
  it('should return undefined if configs is undefined', () => {
    const result = mapAgentConfigs(undefined);
    expect(result).toBeUndefined();
  });

  it('should include behavior_rules even if undefined', () => {
    const configs: AgentConfigDto = {
      behavior_rules: undefined,
      temperature: 0.7,
    };

    const result = mapAgentConfigs(configs);

    expect(result).toBeDefined();
    expect(result?.behavior_rules).toBeUndefined();
    expect('behavior_rules' in result!).toBe(true);
  });

  it('should include behavior_rules as empty array', () => {
    const configs: AgentConfigDto = {
      behavior_rules: [],
      temperature: 0.7,
    };

    const result = mapAgentConfigs(configs);

    expect(result).toBeDefined();
    expect(result?.behavior_rules).toEqual([]);
    expect(Array.isArray(result?.behavior_rules)).toBe(true);
  });

  it('should include behavior_rules as array of strings', () => {
    const configs: AgentConfigDto = {
      behavior_rules: ['Rule 1', 'Rule 2'],
      temperature: 0.7,
    };

    const result = mapAgentConfigs(configs);

    expect(result).toBeDefined();
    expect(result?.behavior_rules).toEqual(['Rule 1', 'Rule 2']);
  });

  it('should not include behavior_rules if not in configs object', () => {
    const configs: AgentConfigDto = {
      temperature: 0.7,
      // behavior_rules is not included
    };

    const result = mapAgentConfigs(configs);

    expect(result).toBeDefined();
    expect('behavior_rules' in result!).toBe(false);
  });

  it('should include all other config fields when defined', () => {
    const configs: AgentConfigDto = {
      temperature: 0.7,
      system_prompt: 'Test prompt',
      model: 'gpt-4',
      max_tokens: 1000,
      response_length: ResponseLength.SHORT,
      age: 25,
      gender: Gender.MALE,
      personality: PERSONALITY_TYPES[0] as (typeof PERSONALITY_TYPES)[number],
      sentiment: Sentiment.NEUTRAL,
      interests: ['coding', 'reading'],
      availability: Availability.AVAILABLE,
    };

    const result = mapAgentConfigs(configs);

    expect(result).toEqual({
      temperature: 0.7,
      system_prompt: 'Test prompt',
      model: 'gpt-4',
      max_tokens: 1000,
      response_length: ResponseLength.SHORT,
      age: 25,
      gender: Gender.MALE,
      personality: PERSONALITY_TYPES[0],
      sentiment: Sentiment.NEUTRAL,
      interests: ['coding', 'reading'],
      availability: Availability.AVAILABLE,
    });
  });

  it('should exclude undefined fields except behavior_rules', () => {
    const configs: AgentConfigDto = {
      behavior_rules: [],
      temperature: undefined,
      system_prompt: undefined,
      model: undefined,
    };

    const result = mapAgentConfigs(configs);

    expect(result).toBeDefined();
    expect(result?.behavior_rules).toEqual([]);
    expect('temperature' in result!).toBe(false);
    expect('system_prompt' in result!).toBe(false);
    expect('model' in result!).toBe(false);
  });
});
