import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('should render with title', () => {
    render(<PageHeader title="Test Page" />);
    expect(screen.getByText('Test Page')).toBeInTheDocument();
  });

  it('should render with leftContent', () => {
    render(<PageHeader leftContent={<div>Custom Content</div>} />);
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should render with actions', () => {
    render(<PageHeader title="Test" actions={<button>Action</button>} />);
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<PageHeader title="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
