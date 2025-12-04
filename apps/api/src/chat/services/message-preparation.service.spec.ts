import { Test, TestingModule } from '@nestjs/testing';
import { MessagePreparationService } from './message-preparation.service';
import { SystemConfigRepository } from '../../system-config/system-config.repository';
import { ConfigurationRulesService } from './configuration-rules.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { AgentConfigService } from '../../agent/services/agent-config.service';
import { MessageRole } from '../../common/enums/message-role.enum';
import { AgentType } from '../../common/enums/agent-type.enum';
import { ResponseLength } from '../../common/enums/response-length.enum';
import { Gender } from '../../common/enums/gender.enum';
import { Sentiment } from '../../common/enums/sentiment.enum';

describe('MessagePreparationService', () => {
  let service: MessagePreparationService;

  const mockSystemConfigRepository = {
    findByKey: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagePreparationService,
        {
          provide: SystemConfigRepository,
          useValue: mockSystemConfigRepository,
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

  describe('prepareMessagesForOpenAI', () => {
    const mockAgentConfig = {
      system_prompt: 'You are a helpful assistant',
      behavior_rules: 'Be polite',
      temperature: 0.7,
      model: 'gpt-4o-mini',
      max_tokens: 1000,
      agentType: AgentType.GENERAL,
      language: 'en',
    };

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

    it('should prepare messages with correct structure: code rules (system) -> admin rules (system) -> client system prompt (user) -> client behavior rules (user) -> conversation -> user message', async () => {
      mockSystemConfigRepository.findByKey.mockResolvedValue(null);
      mockConfigurationRulesService.generateConfigurationRules.mockReturnValue([
        { content: 'Currently it\'s 2025-01-01T00:00:00.000Z', order: 1 },
      ]);
      mockConfigurationRulesService.formatConfigurationRules.mockReturnValue(
        'Currently it\'s 2025-01-01T00:00:00.000Z'
      );

      const result = await service.prepareMessagesForOpenAI(
        mockExistingMessages,
        mockAgentConfig,
        'New message',
        []
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      
      // First message should be code-defined rules (system)
      expect(result[0].role).toBe(MessageRole.SYSTEM);
      expect(result[0].content).toContain('Currently it\'s');
      
      // Client system prompt should be user role
      const systemPromptMessage = result.find(
        (m) => m.role === MessageRole.USER && m.content === 'You are a helpful assistant'
      );
      expect(systemPromptMessage).toBeDefined();
      
      // Client behavior rules should be user role
      const behaviorRulesMessage = result.find(
        (m) => m.role === MessageRole.USER && m.content.includes('Be polite')
      );
      expect(behaviorRulesMessage).toBeDefined();
      
      // Last message should be the new user message
      expect(result[result.length - 1].role).toBe(MessageRole.USER);
      expect(result[result.length - 1].content).toBe('New message');
    });

    it('should add config-based behavior rules as separate USER messages when config fields are set', async () => {
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
        model: 'gpt-4o-mini',
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

      // Verify each generated rule is added as a separate USER message
      const userMessages = result.filter((m) => m.role === MessageRole.USER);
      expect(userMessages.length).toBeGreaterThanOrEqual(5); // At least 5 config-based rules

      // Verify specific rules are present
      expect(
        userMessages.some((m) => m.content.includes('You are male'))
      ).toBe(true);
      expect(
        userMessages.some((m) => m.content.includes('25 years old'))
      ).toBe(true);
      expect(
        userMessages.some((m) => m.content.includes('personality is Analytical'))
      ).toBe(true);
      expect(
        userMessages.some((m) => m.content.includes('feel friendly'))
      ).toBe(true);
      expect(
        userMessages.some((m) => m.content.includes('interests: coding, reading'))
      ).toBe(true);

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
        model: 'gpt-4o-mini',
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

    it('should include memories when provided', async () => {
      mockSystemConfigRepository.findByKey.mockResolvedValue(null);
      mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
        []
      );

      const memories = ['Memory 1', 'Memory 2'];
      const result = await service.prepareMessagesForOpenAI(
        mockExistingMessages,
        mockAgentConfig,
        'New message',
        memories
      );

      expect(result).toBeDefined();
      // Memories are added as a SYSTEM message with context
      const systemMessages = result.filter(
        (m) => m.role === MessageRole.SYSTEM
      );
      const memoryMessage = systemMessages.find(
        (m) => m.content.includes('Memory 1') || m.content.includes('Memory 2')
      );
      expect(memoryMessage).toBeDefined();
    });

    it('should include existing conversation history', async () => {
      mockSystemConfigRepository.findByKey.mockResolvedValue(null);
      mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
        []
      );

      const result = await service.prepareMessagesForOpenAI(
        mockExistingMessages,
        mockAgentConfig,
        'New message',
        []
      );

      expect(result.length).toBeGreaterThan(2); // Rules + client config + history + new message
      const userMessages = result.filter((m) => m.role === MessageRole.USER);
      // Should have: client system prompt + client behavior rules + conversation history + new message
      expect(userMessages.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle empty existing messages', async () => {
      mockSystemConfigRepository.findByKey.mockResolvedValue(null);
      mockConfigurationRulesService.generateConfigurationRules.mockReturnValue(
        []
      );

      const result = await service.prepareMessagesForOpenAI(
        [],
        mockAgentConfig,
        'First message',
        []
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // Client system prompt should be user role
      const systemPromptMessage = result.find(
        (m) => m.role === MessageRole.USER && m.content === 'You are a helpful assistant'
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

      const configWithoutRules = {
        ...mockAgentConfig,
        behavior_rules: undefined,
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
        (m) => m.role === MessageRole.USER && m.content === 'You are a helpful assistant'
      );
      expect(systemPromptMessage).toBeDefined();
    });
  });
});
