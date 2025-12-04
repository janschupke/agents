import { Test, TestingModule } from '@nestjs/testing';
import { MessagePreparationService } from './message-preparation.service';
import { SystemConfigRepository } from '../../system-config/system-config.repository';
import { ConfigurationRulesService } from './configuration-rules.service';
import { LanguageAssistantService } from '../../agent/services/language-assistant.service';
import { MessageRole } from '../../common/enums/message-role.enum';
import { AgentType } from '../../common/enums/agent-type.enum';

describe('MessagePreparationService', () => {
  let service: MessagePreparationService;

  const mockSystemConfigRepository = {
    findByKey: jest.fn(),
  };

  const mockConfigurationRulesService = {
    getSystemBehaviorRules: jest.fn(),
    getAgentBehaviorRules: jest.fn(),
    mergeBehaviorRules: jest.fn(),
  };

  const mockLanguageAssistantService = {
    isLanguageAssistant: jest.fn(),
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
      ],
    }).compile();

    service = module.get<MessagePreparationService>(
      MessagePreparationService
    );
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

    it('should prepare messages with system prompt and behavior rules', async () => {
      mockConfigurationRulesService.getSystemBehaviorRules.mockResolvedValue(
        []
      );
      mockConfigurationRulesService.getAgentBehaviorRules.mockReturnValue(
        'Be polite'
      );
      mockConfigurationRulesService.mergeBehaviorRules.mockReturnValue(
        'Be polite'
      );

      const result = await service.prepareMessagesForOpenAI(
        mockExistingMessages,
        mockAgentConfig,
        'New message',
        []
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].role).toBe(MessageRole.SYSTEM);
      expect(result[0].content).toContain('You are a helpful assistant');
    });

    it('should include memories when provided', async () => {
      mockConfigurationRulesService.getSystemBehaviorRules.mockResolvedValue(
        []
      );
      mockConfigurationRulesService.getAgentBehaviorRules.mockReturnValue(
        'Be polite'
      );
      mockConfigurationRulesService.mergeBehaviorRules.mockReturnValue(
        'Be polite'
      );

      const memories = ['Memory 1', 'Memory 2'];
      const result = await service.prepareMessagesForOpenAI(
        mockExistingMessages,
        mockAgentConfig,
        'New message',
        memories
      );

      expect(result).toBeDefined();
      const systemMessage = result.find((m) => m.role === MessageRole.SYSTEM);
      expect(systemMessage?.content).toContain('Memory 1');
      expect(systemMessage?.content).toContain('Memory 2');
    });

    it('should include existing conversation history', async () => {
      mockConfigurationRulesService.getSystemBehaviorRules.mockResolvedValue(
        []
      );
      mockConfigurationRulesService.getAgentBehaviorRules.mockReturnValue(
        'Be polite'
      );
      mockConfigurationRulesService.mergeBehaviorRules.mockReturnValue(
        'Be polite'
      );

      const result = await service.prepareMessagesForOpenAI(
        mockExistingMessages,
        mockAgentConfig,
        'New message',
        []
      );

      expect(result.length).toBeGreaterThan(2); // System + history + new message
      const userMessages = result.filter((m) => m.role === MessageRole.USER);
      expect(userMessages.length).toBeGreaterThan(0);
    });

    it('should handle empty existing messages', async () => {
      mockConfigurationRulesService.getSystemBehaviorRules.mockResolvedValue(
        []
      );
      mockConfigurationRulesService.getAgentBehaviorRules.mockReturnValue(
        'Be polite'
      );
      mockConfigurationRulesService.mergeBehaviorRules.mockReturnValue(
        'Be polite'
      );

      const result = await service.prepareMessagesForOpenAI(
        [],
        mockAgentConfig,
        'First message',
        []
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].role).toBe('system');
    });

    it('should handle missing behavior rules', async () => {
      mockConfigurationRulesService.getSystemBehaviorRules.mockResolvedValue(
        []
      );
      mockConfigurationRulesService.getAgentBehaviorRules.mockReturnValue(
        undefined
      );
      mockConfigurationRulesService.mergeBehaviorRules.mockReturnValue(
        undefined
      );

      const configWithoutRules = { ...mockAgentConfig, behavior_rules: undefined };
      const result = await service.prepareMessagesForOpenAI(
        mockExistingMessages,
        configWithoutRules,
        'New message',
        []
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
