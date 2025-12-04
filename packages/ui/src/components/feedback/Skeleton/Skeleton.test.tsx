import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonMessage, SkeletonList } from './Skeleton';

describe('Skeleton', () => {
  it('should render skeleton', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('SkeletonMessage', () => {
  it('should render skeleton message', () => {
    const { container } = render(<SkeletonMessage />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<SkeletonMessage className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('SkeletonList', () => {
  it('should render skeleton list with default count', () => {
    const { container } = render(<SkeletonList />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render skeleton list with custom count', () => {
    const { container } = render(<SkeletonList count={5} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<SkeletonList className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
