import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BotSelector from './BotSelector';
import { BotProvider } from '../../../contexts/BotContext';
import { AppProvider } from '../../../contexts/AppContext';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock BotService
vi.mock('../../services/bot.service', () => ({
  BotService: {
    getAllBots: vi.fn().mockResolvedValue([
      { id: 1, name: 'Bot 1', description: 'Description 1', createdAt: '2024-01-01' },
      { id: 2, name: 'Bot 2', description: 'Description 2', createdAt: '2024-01-02' },
    ]),
  },
}));

// Mock ChatService
vi.mock('../../services/chat.service', () => ({
  ChatService: {
    getSessions: vi.fn().mockResolvedValue([]),
  },
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <AppProvider>
      <BotProvider>{children}</BotProvider>
    </AppProvider>
  </AuthProvider>
);

// Helper to wait for bots to load
const waitForBotsToLoad = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
};

describe('BotSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render bot selector button', async () => {
    render(
      <TestWrapper>
        <BotSelector />
      </TestWrapper>
    );

    await waitForBotsToLoad();
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /select bot/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <BotSelector />
      </TestWrapper>
    );

    await waitForBotsToLoad();
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /select bot/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const button = screen.getByRole('button', { name: /select bot/i });
    await user.click(button);

    await waitFor(
      () => {
        expect(screen.getByText('Bot 2')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should open dropdown and show bot list', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <BotSelector />
      </TestWrapper>
    );

    await waitForBotsToLoad();
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /select bot/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Open dropdown
    const button = screen.getByRole('button', { name: /select bot/i });
    await user.click(button);

    // Should show bot options
    await waitFor(
      () => {
        expect(screen.getByText('Bot 1')).toBeInTheDocument();
        expect(screen.getByText('Bot 2')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should render dropdown menu when opened', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <BotSelector />
      </TestWrapper>
    );

    await waitForBotsToLoad();
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: /select bot/i })).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Open dropdown
    const button = screen.getByRole('button', { name: /select bot/i });
    await user.click(button);

    // Should show dropdown with bots
    await waitFor(
      () => {
        const bot1 = screen.getByText('Bot 1');
        expect(bot1).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should render with placeholder when no bot selected', async () => {
    render(
      <TestWrapper>
        <BotSelector />
      </TestWrapper>
    );

    await waitForBotsToLoad();
    await waitFor(
      () => {
        // Should show button (either with bot name or "Select Bot")
        const button = screen.getByRole('button', { name: /select bot/i });
        expect(button).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
