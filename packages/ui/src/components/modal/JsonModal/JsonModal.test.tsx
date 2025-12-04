import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JsonModal from './JsonModal';

describe('JsonModal', () => {
  it('should not render when isOpen is false', () => {
    render(
      <JsonModal
        isOpen={false}
        onClose={vi.fn()}
        title="Test"
        data={{ test: 'data' }}
      />
    );
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <JsonModal
        isOpen
        onClose={vi.fn()}
        title="JSON Data"
        data={{ key: 'value' }}
      />
    );
    expect(screen.getByText('JSON Data')).toBeInTheDocument();
    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <JsonModal
        isOpen
        onClose={handleClose}
        title="Test"
        data={{ test: 'data' }}
      />
    );

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should format JSON data correctly', () => {
    const data = { name: 'Test', count: 42 };
    render(<JsonModal isOpen onClose={vi.fn()} title="Test" data={data} />);
    expect(screen.getByText(/"name": "Test"/)).toBeInTheDocument();
    expect(screen.getByText(/"count": 42/)).toBeInTheDocument();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <JsonModal
        isOpen
        onClose={handleClose}
        title="Test"
        data={{ test: 'data' }}
      />
    );

    await user.keyboard('{Escape}');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Enter key is pressed', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <JsonModal
        isOpen
        onClose={handleClose}
        title="Test"
        data={{ test: 'data' }}
      />
    );

    await user.keyboard('{Enter}');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when other keys are pressed', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <JsonModal
        isOpen
        onClose={handleClose}
        title="Test"
        data={{ test: 'data' }}
      />
    );

    await user.keyboard('a');
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('should not attach keyboard listeners when modal is closed', () => {
    const handleClose = vi.fn();

    render(
      <JsonModal
        isOpen={false}
        onClose={handleClose}
        title="Test"
        data={{ test: 'data' }}
      />
    );

    // Simulate key press
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    // Should not be called because modal is closed
    expect(handleClose).not.toHaveBeenCalled();
  });
});
