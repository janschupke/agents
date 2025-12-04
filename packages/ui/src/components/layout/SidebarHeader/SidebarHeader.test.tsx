import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SidebarHeader from './SidebarHeader';

describe('SidebarHeader', () => {
  it('should render title', () => {
    render(<SidebarHeader title="Sidebar Title" />);
    expect(screen.getByText('Sidebar Title')).toBeInTheDocument();
  });

  it('should render action button when action is provided', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <SidebarHeader
        title="Sidebar"
        action={{ icon: <span>+</span>, onClick: handleClick }}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should accept custom className', () => {
    const { container } = render(<SidebarHeader title="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
