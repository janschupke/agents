import { MessageRole } from '../../common/enums/message-role.enum';
import {
  SystemPromptSource,
  BehaviorRulesSource,
} from '../enums/rule-source.enum';
import {
  PromptMergeOptions,
  RulesTransformOptions,
} from '../services/prompt-transformation.service';

export interface RuleApplicationConfig {
  // System prompt sources (in merge order)
  systemPromptSources: Array<{
    source: SystemPromptSource;
    priority: number;
    required: boolean;
  }>;

  // Behavior rules sources (in merge order)
  behaviorRulesSources: Array<{
    source: BehaviorRulesSource;
    priority: number;
    role: MessageRole;
    required: boolean;
  }>;

  // Transformation options
  promptTransformation: PromptMergeOptions;
  rulesTransformation: RulesTransformOptions;
}

export const DEFAULT_RULE_APPLICATION_CONFIG: RuleApplicationConfig = {
  systemPromptSources: [
    { source: SystemPromptSource.MAIN, priority: 1, required: false },
    { source: SystemPromptSource.AGENT_TYPE, priority: 2, required: false },
    { source: SystemPromptSource.ARCHETYPE, priority: 3, required: false },
  ],
  behaviorRulesSources: [
    {
      source: BehaviorRulesSource.MAIN,
      priority: 1,
      role: MessageRole.SYSTEM,
      required: false,
    },
    {
      source: BehaviorRulesSource.AGENT_TYPE,
      priority: 2,
      role: MessageRole.SYSTEM,
      required: false,
    },
    {
      source: BehaviorRulesSource.CLIENT_CONFIG,
      priority: 3,
      role: MessageRole.SYSTEM,
      required: false,
    },
    {
      source: BehaviorRulesSource.CLIENT_USER,
      priority: 4,
      role: MessageRole.USER,
      required: false,
    },
  ],
  promptTransformation: {
    separator: '\n\n---\n\n',
    embedTimeAt: 'start',
    timeFormat: 'iso',
  },
  rulesTransformation: {
    format: 'numbered',
    separator: '\n',
  },
};
