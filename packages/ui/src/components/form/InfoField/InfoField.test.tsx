import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfoField from './InfoField';

describe('InfoField', () => {
  it('should render label and string value', () => {
    render(<InfoField label="Name" value="John Doe" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render label and ReactNode value', () => {
    render(
      <InfoField label="Status" value={<span>Active</span>} />
    );
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(
      <InfoField label="Test" value="Value" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
