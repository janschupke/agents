/**
 * Message role enum
 * Defines the role of a message in a conversation
 */

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

/**
 * Convert MessageRole enum to lowercase string for OpenAI API
 */
export function messageRoleToOpenAI(role: MessageRole): 'user' | 'assistant' | 'system' {
  const roleMap: Record<MessageRole, 'user' | 'assistant' | 'system'> = {
    [MessageRole.USER]: 'user',
    [MessageRole.ASSISTANT]: 'assistant',
    [MessageRole.SYSTEM]: 'system',
  };
  return roleMap[role];
}

/**
 * Convert lowercase string to MessageRole enum
 */
export function openAIToMessageRole(role: 'user' | 'assistant' | 'system'): MessageRole {
  const roleMap: Record<'user' | 'assistant' | 'system', MessageRole> = {
    user: MessageRole.USER,
    assistant: MessageRole.ASSISTANT,
    system: MessageRole.SYSTEM,
  };
  return roleMap[role];
}
