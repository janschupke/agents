import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SidebarContent from './SidebarContent';

describe('SidebarContent', () => {
  it('should render children', () => {
    render(<SidebarContent>Content</SidebarContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should show loading component when loading and no children', () => {
    render(
      <SidebarContent loading loadingComponent={<div>Loading...</div>}>
        {null}
      </SidebarContent>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should not show loading when children exist', () => {
    render(
      <SidebarContent loading loadingComponent={<div>Loading...</div>}>
        <div>Content</div>
      </SidebarContent>
    );
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should show empty message when empty and no children', () => {
    render(
      <SidebarContent empty emptyMessage="No items">
        {null}
      </SidebarContent>
    );
    expect(screen.getByText('No items')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <SidebarContent className="custom-class">Content</SidebarContent>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
