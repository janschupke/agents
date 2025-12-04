import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageTitle from './PageTitle';

describe('PageTitle', () => {
  it('should render children', () => {
    render(<PageTitle>Page Title</PageTitle>);
    expect(screen.getByText('Page Title')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<PageTitle className="custom-class">Title</PageTitle>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
