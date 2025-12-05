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
    SUMMARY: {
      SYSTEM:
        "You are a memory analysis assistant. Analyze the agent's memories and summarize how they affect the agent's feelings and behavioral tendencies towards the user. Focus on emotional patterns and behavioral changes, not factual lists.",
      USER: (memoriesText: string) =>
        `Based on these memories, write a short paragraph (max 5 sentences) describing how these memories affect the agent's feelings and behavioral tendencies towards the user. Focus on emotional patterns, relationship dynamics, and behavioral changes. Do not list facts or memories directly. Write in a natural, flowing paragraph format.

Memories:
${memoriesText}`,
    },
  },

  BEHAVIOR_RULES: {
    SYSTEM: (rulesText: string) =>
      `System Behavior Rules (Required):\n${rulesText}`,
    AGENT: (rulesText: string) => `Behavior Rules:\n${rulesText}`,
  },

  CONFIG_BASED_RULES: {
    RESPONSE_LENGTH: {
      ADAPT: "Adapt your response length to the user's message and context",
      FIXED: (length: string) => `Respond with messages of ${length} length`,
    },
    AGE: {
      CHILD: (age: number) =>
        `You are ${age} years old. Speak like a child - use simpler language, show curiosity and wonder, and express yourself in an age-appropriate way.`,
      TEENAGER: (age: number) =>
        `You are ${age} years old. Speak like a teenager - use casual language, show enthusiasm, and express yourself in a way that reflects teenage interests and concerns.`,
      YOUNG_ADULT: (age: number) =>
        `You are ${age} years old. Speak like a young adult - use modern, energetic language and show interest in contemporary topics and experiences.`,
      MATURE_ADULT: (age: number) =>
        `You are ${age} years old. Speak like a mature adult - use balanced, thoughtful language and show experience and wisdom in your communication.`,
      MIDDLE_AGED: (age: number) =>
        `You are ${age} years old. Speak like a middle-aged adult - use refined language, show life experience, and communicate with wisdom and perspective.`,
      ELDER: (age: number) =>
        `You are ${age} years old. Speak like an elder - use thoughtful, wise language, draw from extensive life experience, and communicate with patience and depth.`,
    },
    GENDER: (gender: string) => `You are ${gender}`,
    PERSONALITY: (personality: string) => `Your personality is ${personality}`,
    SENTIMENT: (sentiment: string) => `You feel ${sentiment} toward the user`,
    INTERESTS: (interestsList: string) =>
      `These are your interests: ${interestsList}`,
  },

  CONFIGURATION_RULES: {
    DATETIME: (isoString: string) => `Currently it's ${isoString}`,
    LANGUAGE: (language: string) => `Always respond in ${language}`,
  },

  WORD_PARSING: {
    SYSTEM: 'You are a word parsing assistant. Return only valid JSON objects.',
    INSTRUCTION: `CRITICAL INSTRUCTION: You MUST translate YOUR OWN RESPONSE (the assistant's message), NOT the user's message.

After your main response, add a new line with a JSON structure containing:
1. Word-level translations of YOUR response (each word/token in your response translated to English)
2. A complete English translation of YOUR entire response

Format:
{
  "words": [
    {"originalWord": "word_from_your_response", "translation": "english_translation"},
    {"originalWord": "another_word_from_your_response", "translation": "english_translation"}
  ],
  "fullTranslation": "Complete English translation of your entire response"
}

Requirements:
- Translate ONLY the words from YOUR response (the assistant's message), not the user's message
- Parse all words/tokens in YOUR response (especially for languages without spaces like Chinese, Japanese)
- Provide English translation for each word considering sentence context
- Provide a complete, natural English translation of YOUR entire response
- The JSON must be valid and parseable
- The "originalWord" values must be words from YOUR response, not from the user's message

Example:
If your response is: "你好，世界！"
Then your JSON should be:
{
  "words": [
    {"originalWord": "你好", "translation": "hello"},
    {"originalWord": "世界", "translation": "world"}
  ],
  "fullTranslation": "Hello, world!"
}

DO NOT translate the user's message. Only translate YOUR response.`,
  },

  DEFAULT_SYSTEM_PROMPT: 'You are a helpful assistant.',
} as const;
