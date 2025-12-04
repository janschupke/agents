import { Injectable, Logger } from '@nestjs/common';
import { SystemConfigRepository } from './system-config.repository';
import { UpdateSystemConfigDto } from '../common/dto/system-config.dto';
import { SystemConfig } from '../common/types/config.types';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(
    private readonly systemConfigRepository: SystemConfigRepository
  ) {}

  async getBehaviorRules(): Promise<string[]> {
    this.logger.debug('Getting system behavior rules');
    const config =
      await this.systemConfigRepository.findByKey('behavior_rules');
    if (!config) {
      this.logger.debug('No behavior rules configured');
      return [];
    }

    const rules = this.parseBehaviorRules(config.configValue);
    this.logger.debug(`Found ${rules.length} behavior rules`);
    return rules;
  }

  async getAllConfigs(): Promise<SystemConfig> {
    this.logger.debug('Getting all system configs');
    return this.systemConfigRepository.findAllAsRecord();
  }

  async updateBehaviorRules(rules: string[]): Promise<void> {
    this.logger.log(`Updating system behavior rules (${rules.length} rules)`);
    await this.systemConfigRepository.upsert('behavior_rules', rules);
    this.logger.log('System behavior rules updated successfully');
  }

  async updateConfigs(configs: UpdateSystemConfigDto): Promise<void> {
    this.logger.log('Updating system configs');
    await this.systemConfigRepository.updateConfigs(
      configs as SystemConfig
    );
    this.logger.log('System configs updated successfully');
  }

  private parseBehaviorRules(behaviorRules: unknown): string[] {
    if (!behaviorRules) return [];

    try {
      if (typeof behaviorRules === 'string') {
        try {
          const parsed = JSON.parse(behaviorRules);
          if (Array.isArray(parsed)) {
            return parsed.map((r) => String(r));
          } else if (
            typeof parsed === 'object' &&
            parsed !== null &&
            'rules' in parsed &&
            Array.isArray((parsed as { rules: unknown }).rules)
          ) {
            return (parsed as { rules: unknown[] }).rules.map((r: unknown) =>
              String(r)
            );
          } else {
            return [String(parsed)];
          }
        } catch {
          return [behaviorRules];
        }
      } else if (Array.isArray(behaviorRules)) {
        return behaviorRules.map((r: unknown) => String(r));
      } else if (
        typeof behaviorRules === 'object' &&
        behaviorRules !== null &&
        'rules' in behaviorRules &&
        Array.isArray((behaviorRules as { rules: unknown }).rules)
      ) {
        const rulesObj = behaviorRules as { rules: unknown[] };
        return rulesObj.rules.map((r: unknown) => String(r));
      } else {
        return [String(behaviorRules)];
      }
    } catch (error) {
      this.logger.error('Error parsing behavior rules:', error);
      return [];
    }
  }
}
