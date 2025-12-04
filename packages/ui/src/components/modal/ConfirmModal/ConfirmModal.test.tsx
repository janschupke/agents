import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  it('should not render when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test"
        message="Test message"
      />
    );
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test Title"
        message="Test message"
      />
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <ConfirmModal
        isOpen
        onClose={handleClose}
        onConfirm={vi.fn()}
        title="Test"
        message="Message"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        title="Test"
        message="Message"
      />
    );

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('should use custom button text', () => {
    render(
      <ConfirmModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Test"
        message="Message"
        confirmText="Yes"
        cancelText="No"
      />
    );
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });
});
