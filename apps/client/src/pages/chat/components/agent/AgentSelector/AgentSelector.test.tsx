import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentSelector from './AgentSelector';
import { AppProvider } from '../../../../../contexts/AppContext';
import { AuthProvider } from '../../../../../contexts/AuthContext';
import { QueryProvider } from '../../../../../providers/QueryProvider';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({
    isSignedIn: true,
    isLoaded: true,
  })),
}));

// Mock useAgents hook
const mockUseAgents = vi.fn();
vi.mock('../../../../../hooks/queries/use-agents', () => ({
  useAgents: () => mockUseAgents(),
}));

// Mock SessionService
vi.mock('../../../../../services/chat/session/session.service', () => ({
  SessionService: {
    getSessions: vi.fn().mockResolvedValue([]),
  },
}));

import { MemoryRouter } from 'react-router-dom';

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <QueryProvider>
      <AuthProvider>
        <AppProvider>{children}</AppProvider>
      </AuthProvider>
    </QueryProvider>
  </MemoryRouter>
);

// Helper to wait for agents to load
const waitForAgentsToLoad = async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
};

describe('AgentSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAgents.mockReturnValue({
      data: [
        {
          id: 1,
          name: 'Agent 1',
          description: 'Description 1',
          avatarUrl: null,
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          name: 'Agent 2',
          description: 'Description 2',
          avatarUrl: null,
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ],
      isLoading: false,
    });
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
          screen.getByRole('button', { name: /config\.selectAgent/i })
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
          screen.getByRole('button', { name: /config\.selectAgent/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const button = screen.getByRole('button', { name: /config\.selectAgent/i });
    await user.click(button);

    await waitFor(
      () => {
        expect(screen.getByText(/Agent 2/i)).toBeInTheDocument();
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
          screen.getByRole('button', { name: /config\.selectAgent/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Open dropdown
    const button = screen.getByRole('button', { name: /config\.selectAgent/i });
    await user.click(button);

    // Should show agent options
    await waitFor(
      () => {
        expect(screen.getByText(/Agent 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Agent 2/i)).toBeInTheDocument();
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
          screen.getByRole('button', { name: /config\.selectAgent/i })
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Open dropdown
    const button = screen.getByRole('button', { name: /config\.selectAgent/i });
    await user.click(button);

    // Should show dropdown with agents
    await waitFor(
      () => {
        const agent1 = screen.getByText(/Agent 1/i);
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
        const button = screen.getByRole('button', {
          name: /config\.selectAgent/i,
        });
        expect(button).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
