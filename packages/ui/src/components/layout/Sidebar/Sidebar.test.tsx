import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar', () => {
  it('should render children', () => {
    render(<Sidebar>Sidebar Content</Sidebar>);
    expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
  });

  it('should render different width variants', () => {
    const { rerender } = render(<Sidebar width="sm">Content</Sidebar>);
    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(<Sidebar width="md">Content</Sidebar>);
    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(<Sidebar width="lg">Content</Sidebar>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should accept custom width as number', () => {
    const { container } = render(<Sidebar width={200}>Content</Sidebar>);
    expect(container.firstChild).toHaveStyle({ width: '200px' });
  });

  it('should accept custom className', () => {
    const { container } = render(
      <Sidebar className="custom-class">Content</Sidebar>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
