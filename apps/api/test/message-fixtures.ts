/**
 * Test helper utilities for creating message fixtures with proper enum usage
 * Use these helpers instead of hardcoded string literals in tests
 */

import { MessageRole, messageRoleToOpenAI } from '@openai/shared-types';

/**
 * Create a message fixture with proper MessageRole enum
 * For services that expect MessageRole enum
 */
export function createMessageFixture(
  role: MessageRole,
  content: string,
  id?: number
): {
  id?: number;
  role: MessageRole;
  content: string;
} {
  return {
    ...(id !== undefined && { id }),
    role,
    content,
  };
}

/**
 * Create a message fixture with string role (for services that expect string)
 * This is a convenience wrapper that converts MessageRole enum to string
 */
export function createMessageFixtureWithStringRole(
  role: MessageRole,
  content: string,
  id?: number
): {
  id?: number;
  role: string;
  content: string;
} {
  return {
    ...(id !== undefined && { id }),
    role: messageRoleToOpenAI(role),
    content,
  };
}

/**
 * Create a message fixture for OpenAI API format (lowercase strings)
 */
export function createOpenAIMessageFixture(
  role: MessageRole,
  content: string
): {
  role: 'user' | 'assistant' | 'system';
  content: string;
} {
  return {
    role: messageRoleToOpenAI(role),
    content,
  };
}

/**
 * Create a conversation fixture with alternating user/assistant messages
 */
export function createConversationFixture(
  messages: Array<{ role: MessageRole; content: string }>
): Array<{
  role: MessageRole;
  content: string;
}> {
  return messages;
}

/**
 * Common message patterns for tests
 */
export const MessageFixtures = {
  // For services that expect MessageRole enum
  user: (content: string, id?: number) =>
    createMessageFixture(MessageRole.USER, content, id),
  assistant: (content: string, id?: number) =>
    createMessageFixture(MessageRole.ASSISTANT, content, id),
  system: (content: string, id?: number) =>
    createMessageFixture(MessageRole.SYSTEM, content, id),
  // For services that expect string role
  userString: (content: string, id?: number) =>
    createMessageFixtureWithStringRole(MessageRole.USER, content, id),
  assistantString: (content: string, id?: number) =>
    createMessageFixtureWithStringRole(MessageRole.ASSISTANT, content, id),
  systemString: (content: string, id?: number) =>
    createMessageFixtureWithStringRole(MessageRole.SYSTEM, content, id),
  // For OpenAI API format (lowercase strings)
  openAI: {
    user: (content: string) =>
      createOpenAIMessageFixture(MessageRole.USER, content),
    assistant: (content: string) =>
      createOpenAIMessageFixture(MessageRole.ASSISTANT, content),
    system: (content: string) =>
      createOpenAIMessageFixture(MessageRole.SYSTEM, content),
  },
};
