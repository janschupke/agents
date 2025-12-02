import { Injectable } from '@nestjs/common';
import { SystemConfigRepository } from './system-config.repository';
import { UpdateSystemConfigDto } from '../common/dto/system-config.dto';

@Injectable()
export class SystemConfigService {
  constructor(
    private readonly systemConfigRepository: SystemConfigRepository
  ) {}

  async getBehaviorRules(): Promise<string[]> {
    const config =
      await this.systemConfigRepository.findByKey('behavior_rules');
    if (!config) {
      return [];
    }

    return this.parseBehaviorRules(config.configValue);
  }

  async getAllConfigs(): Promise<Record<string, unknown>> {
    return this.systemConfigRepository.findAllAsRecord();
  }

  async updateBehaviorRules(rules: string[]): Promise<void> {
    await this.systemConfigRepository.upsert('behavior_rules', rules);
  }

  async updateConfigs(configs: UpdateSystemConfigDto): Promise<void> {
    await this.systemConfigRepository.updateConfigs(
      configs as Record<string, unknown>
    );
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
      console.error('Error parsing behavior rules:', error);
      return [];
    }
  }
}
