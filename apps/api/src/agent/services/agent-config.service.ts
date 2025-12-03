import { Injectable, Logger } from '@nestjs/common';
import { DEFAULT_AGENT_CONFIG } from '../../common/constants/api.constants';

/**
 * Service responsible for agent configuration business logic
 * Separates configuration logic from data access
 */
@Injectable()
export class AgentConfigService {
  private readonly logger = new Logger(AgentConfigService.name);

  /**
   * Get default agent configuration
   */
  getDefaultAgentConfig(): Record<string, unknown> {
    return { ...DEFAULT_AGENT_CONFIG };
  }

  /**
   * Merge agent-specific config with defaults
   * Business logic: ensures all required config keys have values
   */
  mergeAgentConfig(
    agentConfig: Record<string, unknown>
  ): Record<string, unknown> {
    const defaults = this.getDefaultAgentConfig();
    const merged = { ...defaults, ...agentConfig };
    this.logger.debug(
      `Merged agent config. Keys: ${Object.keys(merged).join(', ')}`
    );
    return merged;
  }

  /**
   * Validate agent configuration
   */
  validateAgentConfig(_config: Record<string, unknown>): boolean {
    // Add validation logic here if needed
    return true;
  }
}
