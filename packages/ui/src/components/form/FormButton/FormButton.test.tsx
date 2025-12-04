import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormButton from './FormButton';

describe('FormButton', () => {
  it('should render button with children', () => {
    render(<FormButton>Click me</FormButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<FormButton onClick={handleClick}>Click me</FormButton>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <FormButton onClick={handleClick} disabled>
        Click me
      </FormButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <FormButton onClick={handleClick} loading>
        Click me
      </FormButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should show loading spinner when loading', () => {
    render(<FormButton loading>Loading</FormButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Loading...');
  });

  it('should render different variants', () => {
    const { rerender } = render(<FormButton variant="primary">Primary</FormButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<FormButton variant="secondary">Secondary</FormButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<FormButton variant="danger">Danger</FormButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
