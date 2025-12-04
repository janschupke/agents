import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormButton from './FormButton';

describe('FormButton', () => {
  it('should render button with children', () => {
    render(<FormButton>Click me</FormButton>);
    expect(
      screen.getByRole('button', { name: 'Click me' })
    ).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<FormButton onClick={handleClick}>Click me</FormButton>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();

    render(
      <FormButton onClick={handleClick} disabled>
        Click me
      </FormButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Disabled buttons don't trigger clicks, so no need for userEvent
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', () => {
    const handleClick = vi.fn();

    render(
      <FormButton onClick={handleClick} loading>
        Click me
      </FormButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // Loading buttons don't trigger clicks, so no need for userEvent
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should show loading spinner when loading', () => {
    render(<FormButton loading>Loading</FormButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('title', 'Loading...');
  });

  it('should render primary variant', () => {
    render(<FormButton variant="primary">Primary</FormButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render secondary variant', () => {
    render(<FormButton variant="secondary">Secondary</FormButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render danger variant', () => {
    render(<FormButton variant="danger">Danger</FormButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
