import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChipSelector from './ChipSelector';

describe('ChipSelector', () => {
  const options = ['Option 1', 'Option 2', 'Option 3'];

  it('renders all options', () => {
    render(
      <ChipSelector
        options={options}
        selected={[]}
        onChange={vi.fn()}
        label="Test"
      />
    );
    options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('highlights selected options', () => {
    render(
      <ChipSelector
        options={options}
        selected={['Option 1']}
        onChange={vi.fn()}
        label="Test"
      />
    );
    const option1 = screen.getByText('Option 1');
    expect(option1).toHaveClass('bg-primary');
  });

  it('calls onChange when option is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ChipSelector
        options={options}
        selected={[]}
        onChange={onChange}
        label="Test"
      />
    );

    const option1 = screen.getByText('Option 1');
    await user.click(option1);

    expect(onChange).toHaveBeenCalledWith(['Option 1']);
  });

  it('removes option when clicked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ChipSelector
        options={options}
        selected={['Option 1']}
        onChange={onChange}
        label="Test"
      />
    );

    const option1 = screen.getByText('Option 1');
    await user.click(option1);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('displays error message', () => {
    render(
      <ChipSelector
        options={options}
        selected={[]}
        onChange={vi.fn()}
        label="Test"
        error="Error message"
      />
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('displays hint when no error', () => {
    render(
      <ChipSelector
        options={options}
        selected={[]}
        onChange={vi.fn()}
        label="Test"
        hint="Hint text"
      />
    );
    expect(screen.getByText('Hint text')).toBeInTheDocument();
  });

  it('disables interaction when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ChipSelector
        options={options}
        selected={[]}
        onChange={onChange}
        label="Test"
        disabled
      />
    );

    const option1 = screen.getByText('Option 1');
    await user.click(option1);

    expect(onChange).not.toHaveBeenCalled();
  });
});
