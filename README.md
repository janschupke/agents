# OpenAI API Examples

A TypeScript Node.js project demonstrating OpenAI API usage with example prompts.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```bash
echo "OPENAI_API_KEY=your-api-key-here" > .env
```

3. Add your OpenAI API key to `.env`:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Usage

Build and run the examples:

```bash
npm run build
npm start
```

Or use the dev script to build and run in one command:

```bash
npm run dev
```

## Development Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Run the compiled JavaScript
- `npm run dev` - Build and run in one command
- `npm run tsc` - Type check without emitting files
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and fix issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Type check (alias for tsc)

## Examples Included

- Simple Question: Basic factual question
- Code Explanation: Technical concept explanation
- Creative Writing: Haiku generation
- Problem Solving: Code example request

## CI/CD

GitHub Actions workflows automatically run on push and pull requests:

- TypeScript type checking
- ESLint linting
- Prettier format checking
