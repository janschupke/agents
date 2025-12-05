import { MessageRole, messageRoleToOpenAI } from '@openai/shared-types';

/**
 * OpenAI API message role type
 */
export type OpenAIMessageRole = 'system' | 'user' | 'assistant';

/**
 * Convert MessageRole enum to OpenAI API format (lowercase string)
 * @param role - MessageRole enum value
 * @returns OpenAI API role string
 * @deprecated Use messageRoleToOpenAI from @openai/shared-types instead
 */
export function convertMessageRoleToOpenAI(
  role: MessageRole
): OpenAIMessageRole {
  return messageRoleToOpenAI(role);
}
