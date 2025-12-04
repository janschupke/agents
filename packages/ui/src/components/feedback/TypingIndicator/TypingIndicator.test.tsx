import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TypingIndicator from './TypingIndicator';

describe('TypingIndicator', () => {
  it('should render typing indicator', () => {
    const { container } = render(<TypingIndicator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render three dots', () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('should accept custom className', () => {
    const { container } = render(<TypingIndicator className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should accept custom dotClassName', () => {
    const { container } = render(<TypingIndicator dotClassName="custom-dot" />);
    const dots = container.querySelectorAll('.custom-dot');
    expect(dots).toHaveLength(3);
  });
});
