import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from './Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should render message', () => {
    const handleClose = vi.fn();
    render(<Toast message="Test message" type="info" onClose={handleClose} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render different types', () => {
    const handleClose = vi.fn();
    const { rerender } = render(<Toast message="Test" type="success" onClose={handleClose} />);
    expect(screen.getByText('Test')).toBeInTheDocument();

    rerender(<Toast message="Test" type="error" onClose={handleClose} />);
    expect(screen.getByText('Test')).toBeInTheDocument();

    rerender(<Toast message="Test" type="info" onClose={handleClose} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should call onClose after duration', () => {
    const handleClose = vi.fn();
    render(<Toast message="Test" type="info" onClose={handleClose} duration={1000} />);

    vi.advanceTimersByTime(1000);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const handleClose = vi.fn();
    render(<Toast message="Test" type="info" onClose={handleClose} />);

    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
