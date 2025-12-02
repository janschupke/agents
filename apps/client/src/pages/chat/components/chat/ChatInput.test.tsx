import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from './ChatInput';

describe('ChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render input and send button', () => {
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ChatInput
        input=""
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    );

    expect(
      screen.getByPlaceholderText('chat.placeholder')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chat\.send/i })).toBeInTheDocument();
  });

  it('should update input value when typing', async () => {
    const user = userEvent.setup();
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ChatInput
        input=""
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    );

    const input = screen.getByPlaceholderText('chat.placeholder');
    await user.type(input, 'Hello');

    expect(handleInputChange).toHaveBeenCalledTimes(5); // Once for each character
    expect(handleInputChange).toHaveBeenLastCalledWith('o');
  });

  it('should call onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ChatInput
        input="Test message"
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    );

    const form = screen.getByRole('button', { name: /chat\.send/i }).closest('form');
    if (form) {
      await user.click(screen.getByRole('button', { name: /chat\.send/i }));
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    }
  });

  it('should call onSubmit when Enter is pressed', async () => {
    const user = userEvent.setup();
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ChatInput
        input="Test message"
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    );

    const input = screen.getByPlaceholderText('chat.placeholder');
    await user.type(input, '{Enter}');

    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it('should disable send button when input is empty', () => {
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ChatInput
        input=""
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    );

    const sendButton = screen.getByRole('button', { name: /chat\.send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should disable send button when input is only whitespace', () => {
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ChatInput
        input="   "
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    );

    const sendButton = screen.getByRole('button', { name: /chat\.send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when input has content', () => {
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ChatInput
        input="Hello"
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    );

    const sendButton = screen.getByRole('button', { name: /chat\.send/i });
    expect(sendButton).not.toBeDisabled();
  });

  it('should disable input and button when disabled prop is true', () => {
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ChatInput
        input="Hello"
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={true}
      />
    );

    const input = screen.getByPlaceholderText('chat.placeholder');
    const sendButton = screen.getByRole('button', { name: /chat\.send/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should display current input value', () => {
    const handleInputChange = vi.fn();
    const handleSubmit = vi.fn((e) => e.preventDefault());

    render(
      <ChatInput
        input="Current message"
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    );

    const input = screen.getByPlaceholderText(
      'chat.placeholder'
    ) as HTMLInputElement;
    expect(input.value).toBe('Current message');
  });
});
