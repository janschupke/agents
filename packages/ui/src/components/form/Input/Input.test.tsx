import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input', () => {
  it('should render input', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with value', () => {
    render(<Input value="test" readOnly />);
    expect(screen.getByDisplayValue('test')).toBeInTheDocument();
  });

  it('should handle onChange', () => {
    const handleChange = vi.fn();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    // Use fireEvent for faster testing - we just need to verify onChange is called
    fireEvent.change(input, { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should render small size', () => {
    render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render medium size', () => {
    render(<Input size="md" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render large size', () => {
    render(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should support ref forwarding', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('should accept custom className', () => {
    render(<Input className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });
});
