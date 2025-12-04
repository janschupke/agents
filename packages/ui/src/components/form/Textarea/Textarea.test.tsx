import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  it('should handle onChange', () => {
    const handleChange = vi.fn();

    render(<Textarea onChange={handleChange} />);
    const textarea = screen.getByRole('textbox');

    // Use fireEvent for faster testing - we just need to verify onChange is called
    fireEvent.change(textarea, { target: { value: 'hello' } });
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
