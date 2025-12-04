import { MessageRole } from '../enums/message-role.enum';

/**
 * OpenAI API message role type
 */
export type OpenAIMessageRole = 'system' | 'user' | 'assistant';

/**
 * Convert MessageRole enum to OpenAI API format (lowercase string)
 * @param role - MessageRole enum value
 * @returns OpenAI API role string
 */
export function convertMessageRoleToOpenAI(
  role: MessageRole
): OpenAIMessageRole {
  return role.toLowerCase() as OpenAIMessageRole;
}
