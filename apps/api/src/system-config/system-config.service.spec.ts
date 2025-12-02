import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigService } from './system-config.service';
import { SystemConfigRepository } from './system-config.repository';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let systemConfigRepository: jest.Mocked<SystemConfigRepository>;

  const mockSystemConfigRepository = {
    findByKey: jest.fn(),
    findAllAsRecord: jest.fn(),
    upsert: jest.fn(),
    updateConfigs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        {
          provide: SystemConfigRepository,
          useValue: mockSystemConfigRepository,
        },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
    systemConfigRepository = module.get(SystemConfigRepository);

    jest.clearAllMocks();
  });

  describe('getBehaviorRules', () => {
    it('should return empty array if config not found', async () => {
      systemConfigRepository.findByKey.mockResolvedValue(null);

      const result = await service.getBehaviorRules();

      expect(result).toEqual([]);
      expect(systemConfigRepository.findByKey).toHaveBeenCalledWith(
        'behavior_rules'
      );
    });

    it('should parse array of rules', async () => {
      const config = {
        id: 1,
        configKey: 'behavior_rules',
        configValue: ['Rule 1', 'Rule 2'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      systemConfigRepository.findByKey.mockResolvedValue(config);

      const result = await service.getBehaviorRules();

      expect(result).toEqual(['Rule 1', 'Rule 2']);
    });

    it('should parse JSON string array', async () => {
      const config = {
        id: 1,
        configKey: 'behavior_rules',
        configValue: JSON.stringify(['Rule 1', 'Rule 2']),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      systemConfigRepository.findByKey.mockResolvedValue(config);

      const result = await service.getBehaviorRules();

      expect(result).toEqual(['Rule 1', 'Rule 2']);
    });

    it('should parse object with rules property', async () => {
      const config = {
        id: 1,
        configKey: 'behavior_rules',
        configValue: { rules: ['Rule 1', 'Rule 2'] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      systemConfigRepository.findByKey.mockResolvedValue(config);

      const result = await service.getBehaviorRules();

      expect(result).toEqual(['Rule 1', 'Rule 2']);
    });

    it('should parse JSON string object with rules', async () => {
      const config = {
        id: 1,
        configKey: 'behavior_rules',
        configValue: JSON.stringify({ rules: ['Rule 1', 'Rule 2'] }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      systemConfigRepository.findByKey.mockResolvedValue(config);

      const result = await service.getBehaviorRules();

      expect(result).toEqual(['Rule 1', 'Rule 2']);
    });

    it('should handle single string rule', async () => {
      const config = {
        id: 1,
        configKey: 'behavior_rules',
        configValue: 'Single rule',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      systemConfigRepository.findByKey.mockResolvedValue(config);

      const result = await service.getBehaviorRules();

      expect(result).toEqual(['Single rule']);
    });

    it('should return empty array on parse error', async () => {
      const config = {
        id: 1,
        configKey: 'behavior_rules',
        configValue: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      systemConfigRepository.findByKey.mockResolvedValue(config);

      const result = await service.getBehaviorRules();

      expect(result).toEqual([]);
    });
  });

  describe('getAllConfigs', () => {
    it('should return all configs as record', async () => {
      const configs = {
        behavior_rules: ['Rule 1'],
        other_config: 'value',
      };

      systemConfigRepository.findAllAsRecord.mockResolvedValue(configs);

      const result = await service.getAllConfigs();

      expect(result).toEqual(configs);
      expect(systemConfigRepository.findAllAsRecord).toHaveBeenCalled();
    });
  });

  describe('updateBehaviorRules', () => {
    it('should update behavior rules', async () => {
      const rules = ['Rule 1', 'Rule 2'];

      systemConfigRepository.upsert.mockResolvedValue({
        id: 1,
        configKey: 'behavior_rules',
        configValue: rules,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.updateBehaviorRules(rules);

      expect(systemConfigRepository.upsert).toHaveBeenCalledWith(
        'behavior_rules',
        rules
      );
    });
  });

  describe('updateConfigs', () => {
    it('should update multiple configs', async () => {
      const configs = {
        behavior_rules: ['Rule 1'],
        other_config: 'value',
      };

      systemConfigRepository.updateConfigs.mockResolvedValue(undefined);

      await service.updateConfigs(configs);

      expect(systemConfigRepository.updateConfigs).toHaveBeenCalledWith(
        configs
      );
    });
  });
});
