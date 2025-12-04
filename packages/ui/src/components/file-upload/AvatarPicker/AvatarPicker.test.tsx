import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarPicker from './AvatarPicker';

// Mock useFileUpload hook
const mockHandleRemove = vi.fn();
vi.mock('../hooks/use-file-upload', () => ({
  useFileUpload: vi.fn(({ onChange }) => ({
    fileInputRef: { current: null },
    isDragging: false,
    error: null,
    handleFileInputChange: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
    handleClick: vi.fn(),
    handleRemove: () => {
      mockHandleRemove();
      onChange(null);
    },
  })),
}));

describe('AvatarPicker', () => {
  it('should render avatar picker', () => {
    const handleChange = vi.fn();
    render(<AvatarPicker value={null} onChange={handleChange} />);
    expect(screen.getByText('Avatar')).toBeInTheDocument();
  });

  it('should render image when value is provided', () => {
    const handleChange = vi.fn();
    render(<AvatarPicker value="/test.jpg" onChange={handleChange} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
  });

  it('should call onChange when remove button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<AvatarPicker value="/test.jpg" onChange={handleChange} />);

    const removeButton = screen.getByRole('button');
    await user.click(removeButton);
    expect(mockHandleRemove).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledWith(null);
  });
});
