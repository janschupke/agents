import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageContainer from './PageContainer';

describe('PageContainer', () => {
  it('should render children', () => {
    render(<PageContainer>Page Content</PageContainer>);
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<PageContainer className="custom-class">Content</PageContainer>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
