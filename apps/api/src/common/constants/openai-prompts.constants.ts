/**
 * Centralized OpenAI prompts used across the application
 */

export const OPENAI_PROMPTS = {
  TRANSLATION: {
    SYSTEM:
      'You are a professional translator. Translate the given message to English, preserving context, tone, and meaning. Only return the translation, no additional text.',
    WITH_CONTEXT: (contextString: string, message: string) =>
      `Translate the following message to English. Consider the conversation context to provide an accurate translation that preserves meaning and context.

Previous conversation:
${contextString}

Message to translate:
${message}

Translation:`,
    WITHOUT_CONTEXT: (message: string) =>
      `Translate the following message to English:
${message}

Translation:`,
  },

  WORD_TRANSLATION: {
    SYSTEM:
      'You are a professional translator. Return only valid JSON objects.',
    USER: (messageContent: string) =>
      `You are a professional translator. Analyze the following text and translate each word/token to English, considering the sentence context.

Text to translate:
${messageContent}

For each word or token (handle languages without spaces like Chinese, Japanese, etc.), provide:
1. The original word/token as it appears in the text
2. Its English translation considering the sentence context

Also provide the full sentence translation in natural, fluent English.

Return a JSON object with:
- "fullTranslation": string (the complete message translated into natural, fluent English)
- "words": array where each element has:
  - "originalWord": string (the word/token as it appears in the text)
  - "translation": string (English translation of the word in context)

Example format:
{
  "fullTranslation": "Thank you! I'm also very happy that you're in a good mood. What are your plans for today? Or would you like to talk about something special? 🌟",
  "words": [
    {
      "originalWord": "Hola",
      "translation": "Hello"
    },
    {
      "originalWord": "你好",
      "translation": "Hello"
    },
    ...
  ]
}

Return ONLY the JSON object, no additional text.`,
  },

  MEMORY: {
    EXTRACTION: {
      SYSTEM:
        'You are a memory extraction assistant. Extract key insights from conversations in a concise format.',
      USER: (
        conversationText: string,
        maxInsights: number,
        maxLength: number
      ) =>
        `Extract 1-${maxInsights} key insights from this conversation. 
Focus on:
- User preferences, interests, or important facts about the user
- Main topics discussed
- Important facts or information shared
- Significant agent responses or statements

Format each insight as a short, concise statement (max ${maxLength} characters each).
Each insight should be standalone and meaningful.
Return ONLY the insights, one per line, without numbering or bullets.

Conversation:
${conversationText}`,
    },
    SUMMARIZATION: {
      SYSTEM:
        'You are a memory summarization assistant. Combine related memories into concise summaries.',
      USER: (memoriesText: string, maxLength: number) =>
        `Summarize these related memories into a single, concise memory (max ${maxLength} characters).
Remove redundancy and combine related information.
Return ONLY the summarized memory, no additional text.

Memories:
${memoriesText}`,
    },
  },

  BEHAVIOR_RULES: {
    SYSTEM: (rulesText: string) =>
      `System Behavior Rules (Required):\n${rulesText}`,
    AGENT: (rulesText: string) => `Behavior Rules:\n${rulesText}`,
  },
} as const;
