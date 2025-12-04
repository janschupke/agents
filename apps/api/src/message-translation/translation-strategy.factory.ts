import { Injectable } from '@nestjs/common';
import { MessageRole } from '../common/enums/message-role.enum';
import { TranslationStrategy } from './translation-strategy.interface';
import { InitialTranslationStrategy } from './strategies/initial-translation.strategy';
import { OnDemandTranslationStrategy } from './strategies/on-demand-translation.strategy';

/**
 * Factory for selecting the appropriate translation strategy based on message role
 */
@Injectable()
export class TranslationStrategyFactory {
  constructor(
    private readonly initialStrategy: InitialTranslationStrategy,
    private readonly onDemandStrategy: OnDemandTranslationStrategy
  ) {}

  getStrategy(messageRole: MessageRole): TranslationStrategy {
    switch (messageRole) {
      case MessageRole.ASSISTANT:
        return this.initialStrategy;
      case MessageRole.USER:
        return this.onDemandStrategy;
      default:
        return this.onDemandStrategy; // Default to on-demand
    }
  }
}
