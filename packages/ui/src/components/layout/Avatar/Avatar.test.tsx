import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('should render with image when src is provided', () => {
    render(<Avatar src="/test.jpg" name="John Doe" />);
    const img = screen.getByAltText('John Doe');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
  });

  it('should render initial when no src', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<Avatar name="Test" size="sm" />);
    expect(screen.getByText('T')).toBeInTheDocument();

    rerender(<Avatar name="Test" size="md" />);
    expect(screen.getByText('T')).toBeInTheDocument();

    rerender(<Avatar name="Test" size="lg" />);
    expect(screen.getByText('T')).toBeInTheDocument();

    rerender(<Avatar name="Test" size="xl" />);
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <Avatar name="Test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
