import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentSelector from './AgentSelector';
import { AppProvider } from '../../../../contexts/AppContext';
import { AuthProvider } from '../../../../contexts/AuthContext';
import { QueryProvider } from '../../../../providers/QueryProvider';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock AgentService
vi.mock('../../../../services/agent.service', () => ({
  AgentService: {
    getAllAgents: vi.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Agent 1',
        description: 'Description 1',
        createdAt: '2024-01-01',
      },
      {
        id: 2,
        name: 'Agent 2',
        description: 'Description 2',
        createdAt: '2024-01-02',
      },
    ]),
  },
}));

// Mock ChatService
vi.mock('../../../../services/chat.service', () => ({
  ChatService: {
    getSessions: vi.fn().mockResolvedValue([]),
  },
}));

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryProvider>
    <AuthProvider>
      <AppProvider>{children}</AppProvider>
    </AuthProvider>
  </QueryProvider>
);

// Helper to wait for agents to load
const waitForAgentsToLoad = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
};

describe('AgentSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render agent selector button', async () => {
    render(
      <TestWrapper>
        <AgentSelector />
      </TestWrapper>
    );

    await waitForAgentsToLoad();
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /select agent/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AgentSelector />
      </TestWrapper>
    );

    await waitForAgentsToLoad();
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /select agent/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const button = screen.getByRole('button', { name: /select agent/i });
    await user.click(button);

    await waitFor(
      () => {
        expect(screen.getByText('Agent 2')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should open dropdown and show agent list', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AgentSelector />
      </TestWrapper>
    );

    await waitForAgentsToLoad();
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /select agent/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Open dropdown
    const button = screen.getByRole('button', { name: /select agent/i });
    await user.click(button);

    // Should show agent options
    await waitFor(
      () => {
        expect(screen.getByText('Agent 1')).toBeInTheDocument();
        expect(screen.getByText('Agent 2')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should render dropdown menu when opened', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <AgentSelector />
      </TestWrapper>
    );

    await waitForAgentsToLoad();
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /select agent/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Open dropdown
    const button = screen.getByRole('button', { name: /select agent/i });
    await user.click(button);

    // Should show dropdown with agents
    await waitFor(
      () => {
        const agent1 = screen.getByText('Agent 1');
        expect(agent1).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should render with placeholder when no agent selected', async () => {
    render(
      <TestWrapper>
        <AgentSelector />
      </TestWrapper>
    );

    await waitForAgentsToLoad();
    await waitFor(
      () => {
        // Should show button (either with agent name or "Select Agent")
        const button = screen.getByRole('button', { name: /select agent/i });
        expect(button).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
