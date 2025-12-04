import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormContainer from './FormContainer';

describe('FormContainer', () => {
  it('should render children', () => {
    render(
      <FormContainer>
        <div>Form content</div>
      </FormContainer>
    );
    expect(screen.getByText('Form content')).toBeInTheDocument();
  });

  it('should render error message when error exists', () => {
    render(
      <FormContainer error="Something went wrong">
        <div>Form content</div>
      </FormContainer>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should apply opacity when saving', () => {
    const { container } = render(
      <FormContainer saving>
        <div>Form content</div>
      </FormContainer>
    );
    const content = container.querySelector('.opacity-50');
    expect(content).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <FormContainer className="custom-class">
        <div>Form content</div>
      </FormContainer>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
