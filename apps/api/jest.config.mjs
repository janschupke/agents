import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Resolve ts-jest using require.resolve which works with pnpm
let tsJestPath = 'ts-jest';
try {
  tsJestPath = require.resolve('ts-jest');
} catch (e) {
  // Fallback to string if resolution fails
  tsJestPath = 'ts-jest';
}

export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: __dirname,
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': tsJestPath,
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.(t|j)s',
    '!<rootDir>/src/**/*.spec.ts',
    '!<rootDir>/src/**/*.interface.ts',
    '!<rootDir>/src/**/*.dto.ts',
    '!<rootDir>/src/main.ts',
    '!<rootDir>/src/**/node_modules/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
