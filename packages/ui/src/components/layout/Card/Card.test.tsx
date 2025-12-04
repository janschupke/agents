import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from './Card';

describe('Card', () => {
  it('should render card with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render different padding variants', () => {
    const { rerender } = render(<Card padding="none">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(<Card padding="sm">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(<Card padding="md">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(<Card padding="lg">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render different style variants', () => {
    const { rerender } = render(<Card variant="default">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(<Card variant="outlined">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(<Card variant="elevated">Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
