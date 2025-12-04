import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageContent from './PageContent';

describe('PageContent', () => {
  it('should render children', () => {
    render(<PageContent>Content</PageContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <PageContent className="custom-class">Content</PageContent>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should disable scroll when disableScroll is true', () => {
    const { container } = render(
      <PageContent disableScroll>Content</PageContent>
    );
    expect(container.firstChild).toHaveClass('overflow-hidden');
  });
});
