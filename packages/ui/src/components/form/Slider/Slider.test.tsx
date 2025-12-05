import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Slider from './Slider';

describe('Slider', () => {
  it('renders with label', () => {
    render(<Slider value={50} onChange={vi.fn()} label="Test Slider" />);
    expect(screen.getByText('Test Slider')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<Slider value={75} onChange={vi.fn()} label="Test" />);
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('calls onChange when value changes', async () => {
    const onChange = vi.fn();
    render(<Slider value={50} onChange={onChange} label="Test" />);

    const input = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '75' } });

    expect(onChange).toHaveBeenCalledWith(75);
  });

  it('respects min and max values', () => {
    render(
      <Slider value={50} onChange={vi.fn()} min={0} max={100} label="Test" />
    );
    const input = screen.getByRole('slider');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('displays error message', () => {
    render(
      <Slider
        value={50}
        onChange={vi.fn()}
        label="Test"
        error="Error message"
      />
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('displays hint when no error', () => {
    render(
      <Slider value={50} onChange={vi.fn()} label="Test" hint="Hint text" />
    );
    expect(screen.getByText('Hint text')).toBeInTheDocument();
  });

  it('uses custom value formatter', () => {
    render(
      <Slider
        value={0.7}
        onChange={vi.fn()}
        label="Test"
        valueFormatter={(val: number) => val.toFixed(2)}
      />
    );
    expect(screen.getByText('0.70')).toBeInTheDocument();
  });
});
