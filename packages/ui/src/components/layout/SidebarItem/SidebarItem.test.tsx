import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SidebarItem from './SidebarItem';

describe('SidebarItem', () => {
  it('should render with title and description', () => {
    const handleClick = vi.fn();
    render(
      <SidebarItem
        isSelected={false}
        onClick={handleClick}
        title="Item Title"
        description="Item Description"
      />
    );
    expect(screen.getByText('Item Title')).toBeInTheDocument();
    expect(screen.getByText('Item Description')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <SidebarItem isSelected={false} onClick={handleClick} title="Item" />
    );

    await user.click(screen.getByText('Item'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render actions', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    const handleAction = vi.fn();

    render(
      <SidebarItem
        isSelected={false}
        onClick={handleClick}
        title="Item"
        actions={[{ icon: <span>X</span>, onClick: handleAction }]}
      />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]); // Action button
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('should render custom children', () => {
    const handleClick = vi.fn();
    render(
      <SidebarItem isSelected={false} onClick={handleClick}>
        <div>Custom Content</div>
      </SidebarItem>
    );
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const handleClick = vi.fn();
    const { container } = render(
      <SidebarItem
        isSelected={false}
        onClick={handleClick}
        title="Item"
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
