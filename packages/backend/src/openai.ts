import { createOpenAIClient } from './clients.js';

// Example prompt interface
interface Example {
  name: string;
  prompt: string;
}

// Example prompts
const examples: Example[] = [
  {
    name: 'Simple Question',
    prompt: 'What is the capital of France?',
  },
  {
    name: 'Code Explanation',
    prompt: 'Explain what a closure is in JavaScript in one sentence.',
  },
  {
    name: 'Creative Writing',
    prompt: 'Write a haiku about programming.',
  },
  {
    name: 'Problem Solving',
    prompt: 'How do I reverse a string in JavaScript? Provide a code example.',
  },
];

// Function to call OpenAI API
async function runExample(example: Example): Promise<void> {
  const openai = createOpenAIClient();

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Example: ${example.name}`);
  console.log(`Prompt: ${example.prompt}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: example.prompt,
        },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      console.log('Response:');
      console.log(response);
      console.log('\n');
    }
  } catch (error) {
    const err = error as { message?: string; status?: number };
    console.error('Error:', err.message || 'Unknown error');
    if (err.status === 401) {
      console.error('Invalid API key. Please check your .env file.');
    }
  }
}

// Main function to run all examples
async function main(): Promise<void> {
  console.log('OpenAI API Examples');
  console.log('==================\n');

  // Run all examples
  for (const example of examples) {
    await runExample(example);
    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('All examples completed!');
}

// Run the main function
main().catch(console.error);
