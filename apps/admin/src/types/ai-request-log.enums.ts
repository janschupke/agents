import { SortOrder } from '@openai/shared-types';

export enum AiRequestLogOrderBy {
  CREATED_AT = 'createdAt',
  ESTIMATED_PRICE = 'estimatedPrice',
  TOTAL_TOKENS = 'totalTokens',
}

// Use SortOrder from @openai/shared-types instead of OrderDirection
export { SortOrder as OrderDirection };
