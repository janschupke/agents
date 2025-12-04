import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FadeIn from './FadeIn';

describe('FadeIn', () => {
  it('should render children', () => {
    render(<FadeIn>Content</FadeIn>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <FadeIn className="custom-class">Content</FadeIn>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should apply delay style', () => {
    const { container } = render(<FadeIn delay={100}>Content</FadeIn>);
    expect(container.firstChild).toHaveStyle({ animationDelay: '100ms' });
  });
});
