import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DropdownTransition from './DropdownTransition';

describe('DropdownTransition', () => {
  it('should not render when show is false', () => {
    render(
      <DropdownTransition show={false}>
        <div>Content</div>
      </DropdownTransition>
    );
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('should render when show is true', () => {
    render(
      <DropdownTransition show>
        <div>Content</div>
      </DropdownTransition>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <DropdownTransition show className="custom-class">
        <div>Content</div>
      </DropdownTransition>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
