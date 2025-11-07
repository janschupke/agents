import { createOpenAIClient } from './clients.js';
import * as readline from 'readline';

const openai = createOpenAIClient();

// Create readline interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Chat history
const messages: Array<{
  role: 'user' | 'assistant' | 'system';
  content: string;
}> = [];

async function chat(prompt: string): Promise<void> {
  if (!prompt.trim()) {
    return;
  }

  // Add user message to history
  messages.push({ role: 'user', content: prompt });

  try {
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      // Add assistant response to history
      messages.push({ role: 'assistant', content: response });
      console.log(`\nAssistant: ${response}\n`);
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
      console.log('\nGoodbye!');
      rl.close();
      process.exit(0);
    }

    // Clear command
    if (input.toLowerCase() === 'clear') {
      messages.length = 0;
      console.log('\nChat history cleared.\n');
      promptUser();
      return;
    }

    // Help command
    if (input.toLowerCase() === 'help') {
      console.log('\nCommands:');
      console.log('  exit, quit - Exit the chat');
      console.log('  clear      - Clear chat history');
      console.log('  help       - Show this help message\n');
      promptUser();
      return;
    }

    // Process the chat
    await chat(input);
    promptUser();
  });
}

// Main function
function main(): void {
  console.log('Chat with OpenAI');
  console.log('===============');
  console.log('Type your message and press Enter.');
  console.log('Type "exit" or "quit" to end the conversation.');
  console.log('Type "help" for more commands.\n');

  promptUser();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\nGoodbye!');
  rl.close();
  process.exit(0);
});

// Run the main function
main();
