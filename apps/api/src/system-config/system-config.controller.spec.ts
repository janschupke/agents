import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';

describe('SystemConfigController', () => {
  let controller: SystemConfigController;
  let systemConfigService: jest.Mocked<SystemConfigService>;

  const mockSystemConfigService = {
    getBehaviorRules: jest.fn(),
    getAllConfigs: jest.fn(),
    updateBehaviorRules: jest.fn(),
    updateConfigs: jest.fn(),
    getSystemPrompt: jest.fn(),
    updateSystemPrompt: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemConfigController],
      providers: [
        {
          provide: SystemConfigService,
          useValue: mockSystemConfigService,
        },
      ],
    }).compile();

    controller = module.get<SystemConfigController>(SystemConfigController);
    systemConfigService = module.get(SystemConfigService);

    jest.clearAllMocks();
  });

  describe('getBehaviorRules', () => {
    it('should return behavior rules', async () => {
      const rules = ['Rule 1', 'Rule 2'];
      const systemPrompt = 'System prompt';

      systemConfigService.getBehaviorRules.mockResolvedValue(rules);
      systemConfigService.getSystemPrompt.mockResolvedValue(systemPrompt);

      const result = await controller.getBehaviorRules();

      expect(result).toEqual({ rules, system_prompt: systemPrompt });
      expect(systemConfigService.getBehaviorRules).toHaveBeenCalled();
      expect(systemConfigService.getSystemPrompt).toHaveBeenCalled();
    });
  });

  describe('updateBehaviorRules', () => {
    it('should update behavior rules', async () => {
      const rules = ['Rule 1', 'Rule 2'];
      const systemPrompt = 'System prompt';
      const dto = { rules, system_prompt: systemPrompt };

      systemConfigService.updateBehaviorRules.mockResolvedValue(undefined);
      systemConfigService.updateSystemPrompt.mockResolvedValue(undefined);
      systemConfigService.getSystemPrompt.mockResolvedValue(systemPrompt);

      const result = await controller.updateBehaviorRules(dto);

      expect(result).toEqual({ rules, system_prompt: systemPrompt });
      expect(systemConfigService.updateBehaviorRules).toHaveBeenCalledWith(
        rules
      );
      expect(systemConfigService.updateSystemPrompt).toHaveBeenCalledWith(
        systemPrompt
      );
      expect(systemConfigService.getSystemPrompt).toHaveBeenCalled();
    });
  });

  describe('getAllConfigs', () => {
    it('should return all configs', async () => {
      const configs = {
        behavior_rules: ['Rule 1'],
        other_config: 'value',
      };

      systemConfigService.getAllConfigs.mockResolvedValue(configs);

      const result = await controller.getAllConfigs();

      expect(result).toEqual(configs);
      expect(systemConfigService.getAllConfigs).toHaveBeenCalled();
    });
  });

  describe('updateConfigs', () => {
    it('should update configs', async () => {
      const configs = {
        behavior_rules: ['Rule 1'],
        other_config: 'value',
      };

      systemConfigService.updateConfigs.mockResolvedValue(undefined);

      const result = await controller.updateConfigs(configs);

      expect(result).toEqual(configs);
      expect(systemConfigService.updateConfigs).toHaveBeenCalledWith(configs);
    });
  });
});
