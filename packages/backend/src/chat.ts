import { createOpenAIClient } from './clients.js';
import * as readline from 'readline';
import {
  loadBotWithConfig,
  loadBotByNameWithConfig,
  mergeBotConfig,
} from './bot.js';
import {
  createSession,
  loadLatestSession,
  type ChatSession,
} from './session.js';
import { saveMessage, loadMessagesForOpenAI } from './message.js';
import {
  saveMemoryChunk,
  createMemoryChunkFromMessages,
  loadMemoryChunks,
  loadMemoryChunksForBot,
  generateEmbedding,
  findSimilarMemoriesForBot,
} from './memory.js';

// Get bot ID or name from command line arguments
const botIdentifier = process.argv[2];

// Create readline interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const openai = createOpenAIClient();
let botConfig: Record<string, unknown> = {};
let currentSession: ChatSession | null = null;
let sessionId: number | null = null;
let currentBotId: number | null = null;

// In-memory chat history (also persisted to DB)
const messages: Array<{
  role: 'user' | 'assistant' | 'system';
  content: string;
}> = [];

// Store loaded memory chunks for semantic search
let allMemoryChunks: Array<{
  id: number;
  session_id: number;
  chunk: string;
  vector: number[] | null;
  created_at: string;
}> = [];

/**
 * Initialize bot and session
 */
async function initialize(): Promise<void> {
  try {
    // Load bot
    let bot;
    if (!botIdentifier) {
      console.error('Error: Bot ID or name required');
      console.error('Usage: npm run chat [bot-id-or-name]');
      console.error('Example: npm run chat 1');
      console.error('Example: npm run chat TestBot');
      process.exit(1);
    }

    // Try to parse as number (bot ID), otherwise treat as name
    const botId = parseInt(botIdentifier, 10);
    if (!isNaN(botId)) {
      bot = await loadBotWithConfig(botId);
    } else {
      bot = await loadBotByNameWithConfig(botIdentifier);
    }

    if (!bot) {
      console.error(`Error: Bot "${botIdentifier}" not found`);
      process.exit(1);
    }

    currentBotId = bot.id;

    console.log(`\nLoaded bot: ${bot.name}`);
    if (bot.description) {
      console.log(`Description: ${bot.description}`);
    }

    // Merge config with defaults
    botConfig = mergeBotConfig(bot.config);
    console.log(`Model: ${botConfig.model}`);
    console.log(`Temperature: ${botConfig.temperature}\n`);

    // Create or load session
    const existingSession = await loadLatestSession(bot.id);
    if (existingSession) {
      currentSession = existingSession;
      sessionId = existingSession.id;
      console.log(
        `Resuming session #${sessionId}${existingSession.session_name ? ` (${existingSession.session_name})` : ''}`
      );
    } else {
      currentSession = await createSession(bot.id);
      sessionId = currentSession.id;
      console.log(`Created new session #${sessionId}`);
    }

    // Load previous messages
    const previousMessages = await loadMessagesForOpenAI(sessionId);
    if (previousMessages.length > 0) {
      messages.push(...previousMessages);
      console.log(`Loaded ${previousMessages.length} previous message(s)\n`);
    }

    // Load memory chunks with vectors for this session
    try {
      const sessionMemories = await loadMemoryChunks(sessionId);
      allMemoryChunks = sessionMemories;
      if (sessionMemories.length > 0) {
        const withVectors = sessionMemories.filter(
          (m) => m.vector && m.vector.length > 0
        );
        console.log(
          `Loaded ${sessionMemories.length} memory chunk(s) (${withVectors.length} with vectors)\n`
        );
      }

      // Also load memory chunks from all previous sessions for cross-session memory
      if (currentBotId) {
        try {
          const allBotMemories = await loadMemoryChunksForBot(currentBotId, 50); // Load up to 50 most recent
          // Merge with session memories (avoid duplicates)
          const existingIds = new Set(sessionMemories.map((m) => m.id));
          const additionalMemories = allBotMemories.filter(
            (m) => !existingIds.has(m.id)
          );
          allMemoryChunks.push(...additionalMemories);
          if (additionalMemories.length > 0) {
            const withVectors = additionalMemories.filter(
              (m) => m.vector && m.vector.length > 0
            );
            console.log(
              `Loaded ${additionalMemories.length} additional memory chunk(s) from previous sessions (${withVectors.length} with vectors)\n`
            );
          }
        } catch (error) {
          // Don't fail if cross-session memory loading fails
          console.warn(
            'Warning: Failed to load cross-session memories:',
            error
          );
        }
      }
    } catch (error) {
      console.warn('Warning: Failed to load memory chunks:', error);
    }

    // Add system prompt if configured
    if (botConfig.system_prompt) {
      const systemMessage = {
        role: 'system' as const,
        content: String(botConfig.system_prompt),
      };
      // Only add if not already in messages
      if (
        !messages.some(
          (m) => m.role === 'system' && m.content === systemMessage.content
        )
      ) {
        messages.push(systemMessage);
        await saveMessage(sessionId, 'system', systemMessage.content, {
          auto_added: true,
        });
      }
    }
  } catch (error) {
    const err = error as { message?: string };
    console.error(`Initialization error: ${err.message || 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Save memory chunk periodically
 */
async function saveMemoryPeriodically(): Promise<void> {
  if (messages.length > 0 && messages.length % 10 === 0) {
    // Save memory chunk every 10 messages
    try {
      const chunk = createMemoryChunkFromMessages(messages);
      if (sessionId) {
        await saveMemoryChunk(sessionId, chunk);
      }
    } catch (error) {
      // Don't fail on memory save errors
      console.error('Warning: Failed to save memory chunk:', error);
    }
  }
}

async function chat(prompt: string): Promise<void> {
  if (!prompt.trim() || !sessionId) {
    return;
  }

  // Retrieve relevant memories using vector similarity (pgvector or in-memory)
  let relevantMemories: string[] = [];
  if (currentBotId) {
    try {
      // Generate embedding for the user's prompt
      const queryVector = await generateEmbedding(prompt);

      // Use pgvector search if available (searches across all bot sessions)
      // Falls back to in-memory search if pgvector is not enabled
      const similar = await findSimilarMemoriesForBot(
        queryVector,
        currentBotId,
        3, // Top 3 most similar
        0.7 // Similarity threshold
      );

      if (similar.length > 0) {
        relevantMemories = similar.map((m) => m.chunk);
      }
    } catch (error) {
      // Don't fail if memory retrieval fails
      const err = error as { message?: string };
      console.warn(
        `Warning: Failed to retrieve relevant memories: ${err.message || 'Unknown error'}`
      );
    }
  }

  // Add user message to history
  const userMessage = { role: 'user' as const, content: prompt };
  messages.push(userMessage);

  // Save user message to database
  try {
    await saveMessage(sessionId, 'user', prompt);
  } catch (error) {
    console.error('Warning: Failed to save user message:', error);
  }

  try {
    // Prepare messages for OpenAI (include relevant memories as context)
    const messagesForAPI = [...messages];

    // Prepend relevant memories as context if found
    if (relevantMemories.length > 0) {
      const memoryContext = `Relevant context from previous conversations:\n${relevantMemories
        .map((m, i) => `${i + 1}. ${m}`)
        .join('\n\n')}`;

      // Add as a system message with memory context
      // Insert after the main system prompt but before user messages
      const systemMessages = messagesForAPI.filter((m) => m.role === 'system');
      const nonSystemMessages = messagesForAPI.filter(
        (m) => m.role !== 'system'
      );

      messagesForAPI.length = 0;
      messagesForAPI.push(...systemMessages);
      messagesForAPI.push({
        role: 'system',
        content: memoryContext,
      });
      messagesForAPI.push(...nonSystemMessages);
    }

    // Call OpenAI API with bot config
    const completion = await openai.chat.completions.create({
      model: String(botConfig.model || 'gpt-4o-mini'),
      messages: messagesForAPI,
      temperature: Number(botConfig.temperature || 0.7),
      max_tokens: botConfig.max_tokens
        ? Number(botConfig.max_tokens)
        : undefined,
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      // Add assistant response to history
      const assistantMessage = {
        role: 'assistant' as const,
        content: response,
      };
      messages.push(assistantMessage);
      console.log(`\nAssistant: ${response}\n`);

      // Save assistant message to database
      try {
        await saveMessage(sessionId, 'assistant', response, {
          model: botConfig.model,
          temperature: botConfig.temperature,
        });
      } catch (error) {
        console.error('Warning: Failed to save assistant message:', error);
      }

      // Save memory periodically
      await saveMemoryPeriodically();
    }
  } catch (error) {
    const err = error as { message?: string; status?: number };
    console.error(`\nError: ${err.message || 'Unknown error'}`);
    if (err.status === 401) {
      console.error('Invalid API key. Please check your .env file.');
      process.exit(1);
    }
    console.log('');
  }
}

function promptUser(): void {
  rl.question('You: ', async (input) => {
    // Check for exit commands
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      // Save final memory chunk
      if (sessionId && messages.length > 0) {
        try {
          const chunk = createMemoryChunkFromMessages(messages);
          await saveMemoryChunk(sessionId, chunk);
        } catch (error) {
          // Ignore errors on exit
        }
      }
      console.log('\nGoodbye!');
      rl.close();
      process.exit(0);
    }

    // Clear command (clears in-memory but keeps DB history)
    if (input.toLowerCase() === 'clear') {
      messages.length = 0;
      // Reload from database
      if (sessionId) {
        try {
          const dbMessages = await loadMessagesForOpenAI(sessionId);
          messages.push(...dbMessages);
          console.log(
            `\nIn-memory history cleared. Reloaded ${dbMessages.length} message(s) from database.\n`
          );
        } catch (error) {
          console.log('\nChat history cleared.\n');
        }
      } else {
        console.log('\nChat history cleared.\n');
      }
      promptUser();
      return;
    }

    // Help command
    if (input.toLowerCase() === 'help') {
      console.log('\nCommands:');
      console.log('  exit, quit - Exit the chat');
      console.log('  clear      - Clear in-memory history (reloads from DB)');
      console.log('  help       - Show this help message');
      if (sessionId) {
        console.log(`  Session ID: ${sessionId}`);
      }
      console.log('');
      promptUser();
      return;
    }

    // Process the chat
    await chat(input);
    promptUser();
  });
}

// Main function
async function main(): Promise<void> {
  console.log('Chat with OpenAI');
  console.log('===============');

  await initialize();

  console.log('Type your message and press Enter.');
  console.log('Type "exit" or "quit" to end the conversation.');
  console.log('Type "help" for more commands.\n');

  promptUser();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  // Save final memory chunk
  if (sessionId && messages.length > 0) {
    try {
      const chunk = createMemoryChunkFromMessages(messages);
      await saveMemoryChunk(sessionId, chunk);
    } catch (error) {
      // Ignore errors on exit
    }
  }
  console.log('\n\nGoodbye!');
  rl.close();
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
