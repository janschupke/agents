import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Textarea from './Textarea';

describe('Textarea', () => {
  it('should render textarea', () => {
    render(<Textarea />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with value', () => {
    render(<Textarea value="test content" readOnly />);
    expect(screen.getByDisplayValue('test content')).toBeInTheDocument();
  });

  it('should handle onChange', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Textarea onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');

    await user.type(textarea, 'hello');
    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should support ref forwarding', () => {
    const ref = vi.fn();
    render(<Textarea ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('should accept custom className', () => {
    render(<Textarea className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });
});
