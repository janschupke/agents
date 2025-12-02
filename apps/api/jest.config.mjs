import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve ts-jest from workspace root for pnpm workspace compatibility
const workspaceRoot = path.resolve(__dirname, '../..');
const pnpmPath = path.join(workspaceRoot, 'node_modules/.pnpm');
let tsJestPath = 'ts-jest'; // Default fallback

if (fs.existsSync(pnpmPath)) {
  const tsJestDirs = fs.readdirSync(pnpmPath).filter(d => d.startsWith('ts-jest@'));
  if (tsJestDirs.length > 0) {
    const fullPath = path.join(pnpmPath, tsJestDirs[0], 'node_modules/ts-jest');
    if (fs.existsSync(fullPath)) {
      // Use absolute path
      tsJestPath = fullPath;
    }
  }
}

export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: path.resolve(__dirname, 'src'),
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': tsJestPath,
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/main.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
