import { Test, TestingModule } from '@nestjs/testing';
import { TranslationStrategyFactory } from './translation-strategy.factory';
import { InitialTranslationStrategy } from './strategies/initial-translation.strategy';
import { OnDemandTranslationStrategy } from './strategies/on-demand-translation.strategy';
import { MessageRole } from '@openai/shared-types';

describe('TranslationStrategyFactory', () => {
  let factory: TranslationStrategyFactory;
  let initialStrategy: jest.Mocked<InitialTranslationStrategy>;
  let onDemandStrategy: jest.Mocked<OnDemandTranslationStrategy>;

  const mockInitialStrategy = {
    translateMessageWithWords: jest.fn(),
  };

  const mockOnDemandStrategy = {
    translateMessageWithWords: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationStrategyFactory,
        {
          provide: InitialTranslationStrategy,
          useValue: mockInitialStrategy,
        },
        {
          provide: OnDemandTranslationStrategy,
          useValue: mockOnDemandStrategy,
        },
      ],
    }).compile();

    factory = module.get<TranslationStrategyFactory>(
      TranslationStrategyFactory
    );
    initialStrategy = module.get(InitialTranslationStrategy);
    onDemandStrategy = module.get(OnDemandTranslationStrategy);

    jest.clearAllMocks();
  });

  describe('getStrategy', () => {
    it('should return InitialTranslationStrategy for ASSISTANT role', () => {
      const strategy = factory.getStrategy(MessageRole.ASSISTANT);

      expect(strategy).toBe(initialStrategy);
      expect(strategy).not.toBe(onDemandStrategy);
    });

    it('should return OnDemandTranslationStrategy for USER role', () => {
      const strategy = factory.getStrategy(MessageRole.USER);

      expect(strategy).toBe(onDemandStrategy);
      expect(strategy).not.toBe(initialStrategy);
    });

    it('should return OnDemandTranslationStrategy for SYSTEM role (default)', () => {
      const strategy = factory.getStrategy(MessageRole.SYSTEM);

      expect(strategy).toBe(onDemandStrategy);
      expect(strategy).not.toBe(initialStrategy);
    });
  });
});
