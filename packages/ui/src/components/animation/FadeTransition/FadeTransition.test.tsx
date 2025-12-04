import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FadeTransition from './FadeTransition';

describe('FadeTransition', () => {
  it('should render children even when show is false', () => {
    render(
      <FadeTransition show={false}>
        <div>Content</div>
      </FadeTransition>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should apply visibility styles based on show prop', () => {
    const { container, rerender } = render(
      <FadeTransition show={false}>
        <div>Content</div>
      </FadeTransition>
    );
    expect(container.firstChild).toHaveStyle({ visibility: 'hidden' });

    rerender(
      <FadeTransition show>
        <div>Content</div>
      </FadeTransition>
    );
    expect(container.firstChild).toHaveStyle({ visibility: 'visible' });
  });

  it('should accept custom className', () => {
    const { container } = render(
      <FadeTransition show className="custom-class">
        <div>Content</div>
      </FadeTransition>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should use fast duration when specified', () => {
    const { container } = render(
      <FadeTransition show duration="fast">
        <div>Content</div>
      </FadeTransition>
    );
    expect(container.firstChild).toHaveClass('transition-fade-fast');
  });
});
