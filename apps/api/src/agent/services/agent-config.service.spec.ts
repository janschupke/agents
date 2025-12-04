import { Test, TestingModule } from '@nestjs/testing';
import { AgentConfigService } from './agent-config.service';
import { ResponseLength } from '../../common/enums/response-length.enum';
import { Gender } from '../../common/enums/gender.enum';
import { Sentiment } from '../../common/enums/sentiment.enum';
import { PERSONALITY_TYPES } from '@openai/shared-types';

describe('AgentConfigService', () => {
  let service: AgentConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentConfigService],
    }).compile();

    service = module.get<AgentConfigService>(AgentConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateBehaviorRulesFromConfig', () => {
    it('should generate rules for valid response_length values', () => {
      const configs = {
        response_length: ResponseLength.SHORT,
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(1);
      expect(result[0]).toContain('short');
    });

    it('should generate special rule for ADAPT response length', () => {
      const configs = {
        response_length: ResponseLength.ADAPT,
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(1);
      expect(result[0]).toContain("Adapt your response length");
    });

    it('should reject invalid response_length values', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'warn').mockImplementation();
      const configs = {
        response_length: 'invalid-length',
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(0);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid response_length value')
      );
      loggerSpy.mockRestore();
    });

    it('should generate age-based rules for valid ages', () => {
      const configs = {
        age: 25,
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(1);
      expect(result[0]).toContain('25 years old');
      expect(result[0]).toContain('young adult');
    });

    it('should generate different age rules for different age ranges', () => {
      const childConfig = { age: 10 };
      const teenConfig = { age: 15 };
      const adultConfig = { age: 35 };
      const elderConfig = { age: 75 };

      const childResult = service.generateBehaviorRulesFromConfig(childConfig);
      const teenResult = service.generateBehaviorRulesFromConfig(teenConfig);
      const adultResult = service.generateBehaviorRulesFromConfig(adultConfig);
      const elderResult = service.generateBehaviorRulesFromConfig(elderConfig);

      expect(childResult[0]).toContain('child');
      expect(teenResult[0]).toContain('teenager');
      expect(adultResult[0]).toContain('mature adult');
      expect(elderResult[0]).toContain('elder');
    });

    it('should reject invalid age values (out of range)', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'warn').mockImplementation();
      const configs = {
        age: 150, // Invalid: > 100
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(0);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid age value')
      );
      loggerSpy.mockRestore();
    });

    it('should reject invalid age values (negative)', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'warn').mockImplementation();
      const configs = {
        age: -5,
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(0);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid age value')
      );
      loggerSpy.mockRestore();
    });

    it('should generate rules for valid gender values', () => {
      const configs = {
        gender: Gender.MALE,
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(1);
      expect(result[0]).toContain('male');
    });

    it('should reject invalid gender values', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'warn').mockImplementation();
      const configs = {
        gender: 'invalid-gender',
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(0);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid gender value')
      );
      loggerSpy.mockRestore();
    });

    it('should generate rules for valid personality values', () => {
      const validPersonality = PERSONALITY_TYPES[0];
      const configs = {
        personality: validPersonality,
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(1);
      expect(result[0]).toContain(`personality is ${validPersonality}`);
    });

    it('should reject invalid personality values', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'warn').mockImplementation();
      const configs = {
        personality: 'invalid-personality',
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(0);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid personality value')
      );
      loggerSpy.mockRestore();
    });

    it('should generate rules for valid sentiment values', () => {
      const configs = {
        sentiment: Sentiment.FRIENDLY,
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(1);
      expect(result[0]).toContain('friendly');
    });

    it('should reject invalid sentiment values', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'warn').mockImplementation();
      const configs = {
        sentiment: 'invalid-sentiment',
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(0);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid sentiment value')
      );
      loggerSpy.mockRestore();
    });

    it('should generate rules for valid interests array', () => {
      const configs = {
        interests: ['coding', 'reading', 'music'],
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(1);
      expect(result[0]).toContain('interests: coding, reading, music');
    });

    it('should filter out non-string values from interests array', () => {
      const configs = {
        interests: ['coding', 123, 'reading', null, 'music'],
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(1);
      expect(result[0]).toContain('coding, reading, music');
      expect(result[0]).not.toContain('123');
    });

    it('should not generate rules for empty interests array', () => {
      const configs = {
        interests: [],
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBe(0);
    });

    it('should generate multiple rules when multiple config fields are set', () => {
      const configs = {
        response_length: ResponseLength.SHORT,
        age: 25,
        gender: Gender.MALE,
        personality: PERSONALITY_TYPES[0],
        sentiment: Sentiment.FRIENDLY,
        interests: ['coding', 'reading'],
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result.length).toBeGreaterThanOrEqual(5);
      expect(result.some((r) => r.includes('short'))).toBe(true);
      expect(result.some((r) => r.includes('25 years old'))).toBe(true);
      expect(result.some((r) => r.includes('male'))).toBe(true);
      expect(result.some((r) => r.includes('personality'))).toBe(true);
      expect(result.some((r) => r.includes('friendly'))).toBe(true);
      expect(result.some((r) => r.includes('interests'))).toBe(true);
    });

    it('should return empty array when no valid config fields are set', () => {
      const configs = {};

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result).toEqual([]);
    });

    it('should handle null and undefined values gracefully', () => {
      const configs = {
        response_length: null,
        age: undefined,
        gender: null,
        personality: undefined,
        sentiment: null,
        interests: undefined,
      };

      const result = service.generateBehaviorRulesFromConfig(configs);

      expect(result).toEqual([]);
    });
  });
});
