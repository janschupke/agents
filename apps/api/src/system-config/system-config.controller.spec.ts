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

      systemConfigService.getBehaviorRules.mockResolvedValue(rules);

      const result = await controller.getBehaviorRules();

      expect(result).toEqual({ rules });
      expect(systemConfigService.getBehaviorRules).toHaveBeenCalled();
    });
  });

  describe('updateBehaviorRules', () => {
    it('should update behavior rules', async () => {
      const rules = ['Rule 1', 'Rule 2'];
      const dto = { rules };

      systemConfigService.updateBehaviorRules.mockResolvedValue(undefined);

      const result = await controller.updateBehaviorRules(dto);

      expect(result).toEqual({ rules });
      expect(systemConfigService.updateBehaviorRules).toHaveBeenCalledWith(rules);
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
