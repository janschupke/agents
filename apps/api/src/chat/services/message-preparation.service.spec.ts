import { Test, TestingModule } from '@nestjs/testing';
import { MessagePreparationService } from './message-preparation.service';
import { SystemConfigRepository } from '../../system-config/system-config.repository';
import { SystemConfigService } from '../../system-config/system-config.service';
import { ConfigurationRulesService } from './configuration-rules.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { AgentConfigService } from '../../agent/services/agent-config.service';
import { PromptTransformationService } from './prompt-transformation.service';
import { BehaviorRulesTransformationService } from './behavior-rules-transformation.service';
import {
  MessageRole,
  AgentType,
  ResponseLength,
  Gender,
  Sentiment,
  OPENAI_MODELS,
} from '@openai/shared-types';

describe('MessagePreparationService', () => {
  let service: MessagePreparationService;

  const mockSystemConfigRepository = {
    findByKey: jest.fn(),
  };

  const mockSystemConfigService = {
    getSystemPrompt: jest.fn().mockResolvedValue(null),
    getSystemPromptByAgentType: jest.fn().mockResolvedValue(null),
    getBehaviorRulesByAgentType: jest.fn().mockResolvedValue([]),
  };

  const mockConfigurationRulesService = {
    getSystemBehaviorRules: jest.fn(),
    getAgentBehaviorRules: jest.fn(),
    mergeBehaviorRules: jest.fn(),
    generateConfigurationRules: jest.fn().mockReturnValue([]),
    formatConfigurationRules: jest.fn().mockReturnValue(''),
  };

  const mockLanguageAssistantService = {
    isLanguageAssistant: jest.fn(),
  };

  const mockAgentConfigService = {
    generateBehaviorRulesFromConfig: jest.fn().mockReturnValue([]),
  };

  const mockPromptTransformationService = {
    transformPrompt: jest.fn((prompt) => prompt),
    mergeSystemPrompts: jest.fn((prompts) =>
      prompts.filter(Boolean).join('\n\n---\n\n')
    ),
    embedCurrentTime: jest.fn((prompt) => prompt),
  };

  const mockBehaviorRulesTransformationService = {
    transformBehaviorRules: jest.fn((rules) => rules),
    transformRulesToMessage: jest.fn((rules) => rules.join('\n')),
    mergeAndTransformRules: jest.fn((ruleArrays) =>
      ruleArrays.flat().join('\n')
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagePreparationService,
        {
          provide: SystemConfigRepository,
          useValue: mockSystemConfigRepository,
        },
        {
          provide: SystemConfigService,
          useValue: mockSystemConfigService,
        },
        {
          provide: ConfigurationRulesService,
          useValue: mockConfigurationRulesService,
        },
        {
          provide: LanguageAssistantService,
          useValue: mockLanguageAssistantService,
        },
        {
          provide: AgentConfigService,
          useValue: mockAgentConfigService,
        },
        {
          provide: PromptTransformationService,
          useValue: mockPromptTransformationService,
        },
        {
          provide: BehaviorRulesTransformationService,
          useValue: mockBehaviorRulesTransformationService,
        },
      ],
    }).compile();

    service = module.get<MessagePreparationService>(MessagePreparationService);
    mockLanguageAssistantService.isLanguageAssistant.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should add authoritative system prompt as first message when configured', async () => {
    const authoritativePrompt = 'You are a helpful AI assistant.';
    mockSystemConfigService.getSystemPromptByAgentType.mockResolvedValue(
      authoritativePrompt
    );

    const messages = await service.prepareMessagesForOpenAI(
      [],
      {
        agentType: AgentType.GENERAL,
      },
      'Hello',
      []
    );

    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].role).toBe(MessageRole.SYSTEM);
    expect(messages[0].content).toContain(authoritativePrompt);
    expect(
      mockSystemConfigService.getSystemPromptByAgentType
    ).toHaveBeenCalled();
  });

  it('should not add authoritative system prompt when not configured', async () => {
    mockSystemConfigService.getSystemPromptByAgentType.mockResolvedValue(null);

    const messages = await service.prepareMessagesForOpenAI(
      [],
      {
        agentType: AgentType.GENERAL,
      },
      'Hello',
      []
    );

    // Should still have messages but not start with authoritative prompt
    expect(messages.length).toBeGreaterThan(0);
    // First message should not be the authoritative prompt (it would be code-defined rules or user message)
    expect(messages[0].content).not.toBe('');
  });

  describe('prepareMessagesForOpenAI - Rule Hierarchy', () => {
    const mockExistingMessages = [
      {
        role: MessageRole.USER,
        content: 'Hello',
      },
      {
        role: MessageRole.ASSISTANT,
        content: 'Hi there!',
      },
    ];

    describe('Complete Rule Hierarchy', () => {
      it('should maintain correct order: authoritative system prompt (SYSTEM, FIRST) -> code rules (SYSTEM) -> admin rules (SYSTEM) -> config-based rules (SYSTEM) -> system prompt (USER) -> user behavior rules (USER) -> conversation -> user message', async () => {
        mockSystemConfigService.getSystemPromptByAgentType.mockResolvedValue(
          'Authoritative system prompt'
        );
        mockSystemConfigRepository.findByKey.mockResolvedValue({
          configKey: 'behavior_rules',
          configValue: ['Admin rule 1', 'Admin rule 2'],
        });
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          [{ content: "Currently it's 2025-01-01T00:00:00.000Z", order: 1 }]
        );
        mockConfigurationRulesService.formatConfigurationRules.mockReturnValue(
          "Currently it's 2025-01-01T00:00:00.000Z"
        );
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue([
          'You are male',
          'You are 25 years old. Speak like a young adult',
        ]);

        const agentConfig = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules: 'Be polite and friendly',
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
          gender: Gender.MALE,
          age: 25,
        };

        const result = await service.prepareMessagesForOpenAI(
          mockExistingMessages,
          agentConfig,
          'New message',
          []
        );

        // Verify all message types are present
        const systemMessages = result.filter(
          (m) => m.role === MessageRole.SYSTEM
        );
        const userMessages = result.filter((m) => m.role === MessageRole.USER);

        expect(systemMessages.length).toBeGreaterThan(0);
        expect(userMessages.length).toBeGreaterThan(0);

        // Verify order by finding indices
        // Authoritative system prompt should be FIRST (index 0)
        expect(result[0].role).toBe(MessageRole.SYSTEM);
        expect(result[0].content).toContain('Authoritative system prompt');

        const authoritativePromptIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.SYSTEM &&
            m.content.includes('Authoritative system prompt')
        );
        const adminRuleIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.SYSTEM && m.content.includes('Admin rule')
        );
        const configBasedRuleIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.SYSTEM && m.content.includes('You are male')
        );
        // Config-based rules are merged into a single SYSTEM message, so they should be found together
        const systemPromptIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.USER &&
            m.content === 'You are a helpful assistant'
        );
        const userBehaviorRuleIndex = result.findIndex(
          (m) => m.role === MessageRole.USER && m.content.includes('Be polite')
        );
        const conversationIndex = result.findIndex(
          (m) => m.content === 'Hello'
        );
        const newMessageIndex = result.findIndex(
          (m) => m.content === 'New message'
        );

        // Verify hierarchy: authoritative prompt is first, then admin rules, then config-based rules, etc.
        expect(authoritativePromptIndex).toBe(0); // Must be first
        if (adminRuleIndex !== -1) {
          expect(adminRuleIndex).toBeGreaterThan(authoritativePromptIndex);
          expect(adminRuleIndex).toBeLessThan(configBasedRuleIndex);
        }
        expect(configBasedRuleIndex).toBeGreaterThan(authoritativePromptIndex);
        expect(configBasedRuleIndex).toBeLessThan(systemPromptIndex);
        expect(systemPromptIndex).toBeLessThan(userBehaviorRuleIndex);
        expect(userBehaviorRuleIndex).toBeLessThan(conversationIndex);
        expect(conversationIndex).toBeLessThan(newMessageIndex);
      });
    });

    describe('Config-Based Rules (SYSTEM role)', () => {
      it('should add config-based behavior rules as separate SYSTEM messages when config fields are set', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          []
        );
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue([
          'You are male',
          'You are 25 years old. Speak like a young adult - use modern, energetic language and show interest in contemporary topics and experiences.',
          'Your personality is Analytical',
          'You feel friendly toward the user',
          'These are your interests: coding, reading',
        ]);

        const agentConfigWithFields = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules: undefined, // No user-provided rules
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
          response_length: ResponseLength.SHORT,
          age: 25,
          gender: Gender.MALE,
          personality: 'Analytical' as const,
          sentiment: Sentiment.FRIENDLY,
          interests: ['coding', 'reading'],
        };

        const result = await service.prepareMessagesForOpenAI(
          [],
          agentConfigWithFields,
          'New message',
          []
        );

        // Verify config-based rules were generated
        expect(
          mockAgentConfigService.generateBehaviorRulesFromConfig
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            response_length: ResponseLength.SHORT,
            age: 25,
            gender: Gender.MALE,
            personality: 'Analytical',
            sentiment: Sentiment.FRIENDLY,
            interests: ['coding', 'reading'],
          })
        );

        // Verify config-based rules are added as a SYSTEM message (merged into one message)
        const systemMessages = result.filter(
          (m) => m.role === MessageRole.SYSTEM
        );
        expect(systemMessages.length).toBeGreaterThanOrEqual(1); // At least 1 SYSTEM message with config-based rules

        // Verify specific rules are present in the SYSTEM message (they're merged into one message)
        const configRulesMessage = systemMessages.find(
          (m) =>
            m.content.includes('You are male') ||
            m.content.includes('25 years old') ||
            m.content.includes('personality is Analytical')
        );
        expect(configRulesMessage).toBeDefined();
        expect(configRulesMessage?.content).toContain('You are male');
        expect(configRulesMessage?.content).toContain('25 years old');
        expect(configRulesMessage?.content).toContain(
          'personality is Analytical'
        );
        expect(configRulesMessage?.content).toContain('feel friendly');
        expect(configRulesMessage?.content).toContain(
          'interests: coding, reading'
        );

        // Verify config-based SYSTEM rules appear before user-provided USER rules
        const firstSystemRuleIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.SYSTEM && m.content.includes('You are male')
        );
        const systemPromptIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.USER &&
            m.content === 'You are a helpful assistant'
        );
        expect(firstSystemRuleIndex).toBeLessThan(systemPromptIndex);

        // Last message should be the new user message
        expect(result[result.length - 1].role).toBe(MessageRole.USER);
        expect(result[result.length - 1].content).toBe('New message');
      });

      it('should not add config-based behavior rules when no config fields are set', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          []
        );
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfigWithoutFields = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules: undefined,
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
        };

        const result = await service.prepareMessagesForOpenAI(
          [],
          agentConfigWithoutFields,
          'New message',
          []
        );

        // Verify config-based rules generation was called
        expect(
          mockAgentConfigService.generateBehaviorRulesFromConfig
        ).toHaveBeenCalledWith({});

        // Verify no config-based rules were added (only system prompt and user message)
        const userMessages = result.filter((m) => m.role === MessageRole.USER);
        expect(userMessages.length).toBe(2); // System prompt + user message
        expect(userMessages[0].content).toBe('You are a helpful assistant');
        expect(userMessages[1].content).toBe('New message');
      });

      it('should maintain correct rule hierarchy: SYSTEM config rules before USER behavior rules', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          []
        );
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue([
          'You are male',
          'You are 25 years old. Speak like a young adult',
        ]);

        const agentConfig = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules: 'Be polite and friendly',
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
          gender: Gender.MALE,
          age: 25,
        };

        const result = await service.prepareMessagesForOpenAI(
          [],
          agentConfig,
          'New message',
          []
        );

        // Find indices of different message types
        const configBasedRuleIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.SYSTEM && m.content.includes('You are male')
        );
        const systemPromptIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.USER &&
            m.content === 'You are a helpful assistant'
        );
        const userBehaviorRuleIndex = result.findIndex(
          (m) => m.role === MessageRole.USER && m.content.includes('Be polite')
        );

        // Verify hierarchy: config-based SYSTEM rules come before USER rules
        expect(configBasedRuleIndex).toBeLessThan(systemPromptIndex);
        expect(systemPromptIndex).toBeLessThan(userBehaviorRuleIndex);
      });
    });

    describe('User Behavior Rules (USER role)', () => {
      it('should add user-provided behavior rules as USER messages', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          []
        );
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfig = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules:
            'Be polite and friendly\nAlways respond in a professional manner',
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
        };

        const result = await service.prepareMessagesForOpenAI(
          [],
          agentConfig,
          'New message',
          []
        );

        // Verify user behavior rules are added as USER messages
        const userMessages = result.filter((m) => m.role === MessageRole.USER);
        const behaviorRulesMessage = userMessages.find(
          (m) =>
            m.content.includes('Be polite') ||
            m.content.includes('professional')
        );
        expect(behaviorRulesMessage).toBeDefined();
        expect(behaviorRulesMessage?.role).toBe(MessageRole.USER);
      });
    });

    describe('Validation', () => {
      it('should validate and reject invalid enum values in config-based rules', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          []
        );
        const loggerSpy = jest.spyOn(console, 'warn').mockImplementation();

        // Mock to return empty array when invalid values are passed
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfigWithInvalidValues = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules: undefined,
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
          gender: 'invalid-gender' as unknown as Gender,
          age: 150, // Invalid age (> 100)
          sentiment: 'invalid-sentiment' as unknown as Sentiment,
        };

        const result = await service.prepareMessagesForOpenAI(
          [],
          agentConfigWithInvalidValues,
          'New message',
          []
        );

        // Verify config-based rules generation was called with invalid values
        expect(
          mockAgentConfigService.generateBehaviorRulesFromConfig
        ).toHaveBeenCalled();

        // Verify no invalid rules were added
        const systemMessages = result.filter(
          (m) =>
            m.role === MessageRole.SYSTEM &&
            (m.content.includes('invalid-gender') ||
              m.content.includes('150') ||
              m.content.includes('invalid-sentiment'))
        );
        expect(systemMessages.length).toBe(0);

        loggerSpy.mockRestore();
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty existing messages', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          []
        );
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfig = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules: 'Be polite',
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
        };

        const result = await service.prepareMessagesForOpenAI(
          [],
          agentConfig,
          'First message',
          []
        );

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        // Client system prompt should be user role
        const systemPromptMessage = result.find(
          (m) =>
            m.role === MessageRole.USER &&
            m.content === 'You are a helpful assistant'
        );
        expect(systemPromptMessage).toBeDefined();
        // Last message should be the user message
        expect(result[result.length - 1].role).toBe(MessageRole.USER);
        expect(result[result.length - 1].content).toBe('First message');
      });

      it('should handle missing behavior rules', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          []
        );
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const configWithoutRules = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules: undefined,
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
        };
        const result = await service.prepareMessagesForOpenAI(
          mockExistingMessages,
          configWithoutRules,
          'New message',
          []
        );

        expect(result).toBeDefined();
        expect(result.length).toBeGreaterThan(0);
        // Should still have client system prompt as user message
        const systemPromptMessage = result.find(
          (m) =>
            m.role === MessageRole.USER &&
            m.content === 'You are a helpful assistant'
        );
        expect(systemPromptMessage).toBeDefined();
      });

      it('should include memories when provided', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          []
        );
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfig = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules: 'Be polite',
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
        };

        const memories = ['Memory 1', 'Memory 2'];
        const result = await service.prepareMessagesForOpenAI(
          mockExistingMessages,
          agentConfig,
          'New message',
          memories
        );

        expect(result).toBeDefined();
        // Memories are added as a SYSTEM message with context
        const systemMessages = result.filter(
          (m) => m.role === MessageRole.SYSTEM
        );
        const memoryMessage = systemMessages.find(
          (m) =>
            m.content.includes('Memory 1') || m.content.includes('Memory 2')
        );
        expect(memoryMessage).toBeDefined();
      });

      it('should include existing conversation history', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
          []
        );
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfig = {
          system_prompt: 'You are a helpful assistant',
          behavior_rules: 'Be polite',
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
        };

        const result = await service.prepareMessagesForOpenAI(
          mockExistingMessages,
          agentConfig,
          'New message',
          []
        );

        expect(result.length).toBeGreaterThan(2); // Rules + client config + history + new message
        const userMessages = result.filter((m) => m.role === MessageRole.USER);
        // Should have: client system prompt + client behavior rules + conversation history + new message
        expect(userMessages.length).toBeGreaterThanOrEqual(4);
      });
    });
  });
});
