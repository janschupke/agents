/**
 * OpenAI model constants
 * Shared across client, admin, and API
 */

export const OPENAI_MODELS = {
  DEFAULT: 'gpt-4o-mini',
  TRANSLATION: 'gpt-4o-mini',
  MEMORY: 'gpt-4o-mini',
} as const;

/**
 * OpenAI model pricing per 1M tokens (as of 2024)
 * Pricing: input tokens / output tokens
 */
export const OPENAI_MODEL_PRICING = {
  'gpt-4o-mini': {
    input: 0.15, // $0.15 per 1M input tokens
    output: 0.6, // $0.60 per 1M output tokens
  },
  'gpt-4o': {
    input: 2.5,
    output: 10.0,
  },
  'gpt-4-turbo': {
    input: 10.0,
    output: 30.0,
  },
  'gpt-3.5-turbo': {
    input: 0.5,
    output: 1.5,
  },
} as const;

export type OpenAIModelName = keyof typeof OPENAI_MODEL_PRICING;
