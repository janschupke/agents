import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('should render footer with copyright text', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2025 OpenAI Chat/)).toBeInTheDocument();
  });
});
