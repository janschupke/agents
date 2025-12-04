import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('should render with title and message', () => {
    render(<EmptyState title="No items" message="Add items to get started" />);
    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Add items to get started')).toBeInTheDocument();
  });

  it('should render with icon', () => {
    render(<EmptyState icon={<span>Icon</span>} title="Empty" />);
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('should render with ReactNode message', () => {
    render(<EmptyState message={<div>Custom message</div>} />);
    expect(screen.getByText('Custom message')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <EmptyState title="Test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
