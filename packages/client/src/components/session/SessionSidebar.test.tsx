import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionSidebar from './SessionSidebar';
import { Session } from '../../types/chat.types';

describe('SessionSidebar', () => {
  const mockSessions: Session[] = [
    { id: 1, session_name: 'Session 1', createdAt: '2024-01-01T00:00:00Z' },
    { id: 2, session_name: 'Session 2', createdAt: '2024-01-02T00:00:00Z' },
    { id: 3, session_name: 'Session 3', createdAt: '2024-01-03T00:00:00Z' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sessions list', () => {
    const onSessionSelect = vi.fn();
    const onNewSession = vi.fn();

    render(
      <SessionSidebar
        sessions={mockSessions}
        currentSessionId={1}
        onSessionSelect={onSessionSelect}
        onNewSession={onNewSession}
      />
    );

    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Session 1')).toBeInTheDocument();
    expect(screen.getByText('Session 2')).toBeInTheDocument();
    expect(screen.getByText('Session 3')).toBeInTheDocument();
  });

  it('should highlight current session', () => {
    const onSessionSelect = vi.fn();
    const onNewSession = vi.fn();

    render(
      <SessionSidebar
        sessions={mockSessions}
        currentSessionId={2}
        onSessionSelect={onSessionSelect}
        onNewSession={onNewSession}
      />
    );

    // Session 2 should be selected (highlighted)
    const session2 = screen.getByText('Session 2').closest('button');
    expect(session2).toHaveClass('bg-primary');
  });

  it('should call onSessionSelect when session is clicked', async () => {
    const user = userEvent.setup();
    const onSessionSelect = vi.fn();
    const onNewSession = vi.fn();

    render(
      <SessionSidebar
        sessions={mockSessions}
        currentSessionId={1}
        onSessionSelect={onSessionSelect}
        onNewSession={onNewSession}
      />
    );

    const session2 = screen.getByText('Session 2');
    await user.click(session2);

    expect(onSessionSelect).toHaveBeenCalledWith(2);
    expect(onSessionSelect).toHaveBeenCalledTimes(1);
  });

  it('should call onNewSession when new session button is clicked', async () => {
    const user = userEvent.setup();
    const onSessionSelect = vi.fn();
    const onNewSession = vi.fn();

    render(
      <SessionSidebar
        sessions={mockSessions}
        currentSessionId={1}
        onSessionSelect={onSessionSelect}
        onNewSession={onNewSession}
      />
    );

    const newSessionButton = screen.getByTitle('New Session');
    await user.click(newSessionButton);

    expect(onNewSession).toHaveBeenCalledTimes(1);
  });

  it('should show empty state when no sessions', () => {
    const onSessionSelect = vi.fn();
    const onNewSession = vi.fn();

    render(
      <SessionSidebar
        sessions={[]}
        currentSessionId={null}
        onSessionSelect={onSessionSelect}
        onNewSession={onNewSession}
      />
    );

    expect(screen.getByText('No sessions yet')).toBeInTheDocument();
    expect(screen.getByText('Create a new session to start chatting')).toBeInTheDocument();
  });

  it('should show loading skeleton when loading', () => {
    const onSessionSelect = vi.fn();
    const onNewSession = vi.fn();

    render(
      <SessionSidebar
        sessions={[]}
        currentSessionId={null}
        onSessionSelect={onSessionSelect}
        onNewSession={onNewSession}
        loading={true}
      />
    );

    // Should show skeleton instead of empty state
    expect(screen.queryByText('No sessions yet')).not.toBeInTheDocument();
  });

  it('should disable new session button when loading', () => {
    const onSessionSelect = vi.fn();
    const onNewSession = vi.fn();

    render(
      <SessionSidebar
        sessions={mockSessions}
        currentSessionId={1}
        onSessionSelect={onSessionSelect}
        onNewSession={onNewSession}
        loading={true}
      />
    );

    const newSessionButton = screen.getByTitle('New Session');
    expect(newSessionButton).toBeDisabled();
  });

  it('should render all sessions when provided', () => {
    const onSessionSelect = vi.fn();
    const onNewSession = vi.fn();

    render(
      <SessionSidebar
        sessions={mockSessions}
        currentSessionId={null}
        onSessionSelect={onSessionSelect}
        onNewSession={onNewSession}
      />
    );

    mockSessions.forEach((session) => {
      expect(screen.getByText(session.session_name || `Session ${session.id}`)).toBeInTheDocument();
    });
  });
});
