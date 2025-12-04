import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SectionHeader from './SectionHeader';

describe('SectionHeader', () => {
  it('should render title', () => {
    render(<SectionHeader title="Section Title" />);
    expect(screen.getByText('Section Title')).toBeInTheDocument();
  });

  it('should render action button when action is provided', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <SectionHeader
        title="Section"
        action={{ icon: <span>+</span>, onClick: handleClick }}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should disable action button when disabled', () => {
    const handleClick = vi.fn();

    render(
      <SectionHeader
        title="Section"
        action={{ icon: <span>+</span>, onClick: handleClick, disabled: true }}
      />
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should accept custom className', () => {
    const { container } = render(<SectionHeader title="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
