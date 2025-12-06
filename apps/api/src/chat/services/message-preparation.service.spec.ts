import { Test, TestingModule } from '@nestjs/testing';
import { MessagePreparationService } from './message-preparation.service';
import { SystemConfigRepository } from '../../system-config/system-config.repository';
import { SystemConfigService } from '../../system-config/system-config.service';
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
      it('should maintain correct order: authoritative system prompt (SYSTEM, FIRST) -> admin rules (SYSTEM) -> config-based rules (SYSTEM) -> agent name/description (USER) -> conversation -> user message', async () => {
        mockSystemConfigService.getSystemPromptByAgentType.mockResolvedValue(
          'Authoritative system prompt'
        );
        mockSystemConfigService.getBehaviorRulesByAgentType.mockResolvedValue([
          'Admin rule 1',
          'Admin rule 2',
        ]);
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue([
          'You are male',
          'You are 25 years old. Speak like a young adult',
        ]);

        const agentConfig = {
          agentName: 'Test Agent',
          agentDescription: 'A helpful assistant',
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
        const agentNameDescIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.USER &&
            (m.content.includes('Test Agent') ||
              m.content.includes('helpful assistant'))
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
        expect(configBasedRuleIndex).toBeLessThan(agentNameDescIndex);
        expect(agentNameDescIndex).toBeLessThan(conversationIndex);
        expect(conversationIndex).toBeLessThan(newMessageIndex);
      });
    });

    describe('Config-Based Rules (SYSTEM role)', () => {
      it('should add config-based behavior rules as separate SYSTEM messages when config fields are set', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue([
          'You are male',
          'You are 25 years old. Speak like a young adult - use modern, energetic language and show interest in contemporary topics and experiences.',
          'Your personality is Analytical',
          'You feel friendly toward the user',
          'These are your interests: coding, reading',
        ]);

        const agentConfigWithFields = {
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

        // Verify config-based rules were generated (via OPENAI_PROMPTS.AGENT_CONFIG.CONFIG_VALUES)

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

        // Last message should be the new user message
        expect(result[result.length - 1].role).toBe(MessageRole.USER);
        expect(result[result.length - 1].content).toBe('New message');
      });

      it('should not add config-based behavior rules when no config fields are set', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfigWithoutFields = {
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

        // Verify only user message (no agent name/description since not provided)
        const userMessages = result.filter((m) => m.role === MessageRole.USER);
        expect(userMessages.length).toBeGreaterThanOrEqual(1); // At least user message
        expect(userMessages[userMessages.length - 1].content).toBe('New message');
      });

      it('should maintain correct rule hierarchy: SYSTEM config rules before USER agent name/description', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue([
          'You are male',
          'You are 25 years old. Speak like a young adult',
        ]);

        const agentConfig = {
          agentName: 'Test Agent',
          agentDescription: 'A helpful assistant',
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
        const agentNameDescIndex = result.findIndex(
          (m) =>
            m.role === MessageRole.USER &&
            (m.content.includes('Test Agent') ||
              m.content.includes('helpful assistant'))
        );

        // Verify hierarchy: config-based SYSTEM rules come before USER agent name/description
        expect(configBasedRuleIndex).toBeLessThan(agentNameDescIndex);
      });
    });

    describe('User Agent Name and Description (USER role)', () => {
      it('should add agent name and description as USER message when provided', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfig = {
          agentName: 'Test Agent',
          agentDescription: 'A helpful assistant that is polite and friendly',
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

        // Verify agent name and description are added as USER message
        const userMessages = result.filter((m) => m.role === MessageRole.USER);
        const agentNameDescMessage = userMessages.find(
          (m) =>
            m.content.includes('Test Agent') ||
            m.content.includes('helpful assistant')
        );
        expect(agentNameDescMessage).toBeDefined();
        expect(agentNameDescMessage?.role).toBe(MessageRole.USER);
      });
    });

    describe('Validation', () => {
      it('should handle invalid enum values gracefully in config-based rules', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);

        const agentConfigWithInvalidValues = {
          temperature: 0.7,
          model: OPENAI_MODELS.DEFAULT,
          max_tokens: 1000,
          agentType: AgentType.GENERAL,
          language: 'en',
          gender: 'invalid-gender' as unknown as Gender,
          age: 150, // Invalid age (> 100)
          sentiment: 'invalid-sentiment' as unknown as Sentiment,
        };

        // Service should handle invalid values without crashing
        const result = await service.prepareMessagesForOpenAI(
          [],
          agentConfigWithInvalidValues,
          'New message',
          []
        );

        // Verify service returns valid result structure
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
        // Last message should be the user message
        expect(result[result.length - 1].role).toBe(MessageRole.USER);
        expect(result[result.length - 1].content).toBe('New message');
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty existing messages', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfig = {
          agentName: 'Test Agent',
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
        // Last message should be the user message
        expect(result[result.length - 1].role).toBe(MessageRole.USER);
        expect(result[result.length - 1].content).toBe('First message');
      });

      it('should handle missing behavior rules', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const configWithoutRules = {
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
      });

      it('should include memories when provided', async () => {
        mockSystemConfigRepository.findByKey.mockResolvedValue(null);
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfig = {
          agentName: 'Test Agent',
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
        mockAgentConfigService.generateBehaviorRulesFromConfig.mockReturnValue(
          []
        );

        const agentConfig = {
          agentName: 'Test Agent',
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
        // Should have: agent name/description (if provided) + conversation history + new message
        expect(userMessages.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
