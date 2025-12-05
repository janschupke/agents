import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Select from './Select';

describe('Select', () => {
  it('should render select element', () => {
    render(
      <Select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render options', () => {
    render(
      <Select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </Select>
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <Select className="custom-class">
        <option value="1">Option 1</option>
      </Select>
    );
    expect(container.querySelector('select')).toHaveClass('custom-class');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(
      <Select ref={ref}>
        <option value="1">Option 1</option>
      </Select>
    );
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });
});
