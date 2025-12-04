import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainTitle from './MainTitle';

describe('MainTitle', () => {
  it('should render children', () => {
    render(<MainTitle>App Title</MainTitle>);
    expect(screen.getByText('App Title')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <MainTitle className="custom-class">Title</MainTitle>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
