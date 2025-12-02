import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConfirm } from './useConfirm';

// Mock ConfirmModal component
vi.mock('../components/ui/modal', () => ({
  ConfirmModal: ({ isOpen, onConfirm, onClose, title, message }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-modal">
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    );
  },
}));

describe('useConfirm', () => {
  it('should return confirm function and ConfirmDialog', () => {
    const { result } = renderHook(() => useConfirm());

    expect(result.current.confirm).toBeDefined();
    expect(typeof result.current.confirm).toBe('function');
    expect(result.current.ConfirmDialog).toBeNull();
  });

  it('should show ConfirmDialog when confirm is called', async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmPromise: Promise<boolean>;
    act(() => {
      confirmPromise = result.current.confirm({
        message: 'Are you sure?',
        title: 'Confirm Action',
      });
    });

    expect(result.current.ConfirmDialog).not.toBeNull();

    // Resolve the promise by clicking confirm
    act(() => {
      // Simulate clicking confirm button
      const modal = result.current.ConfirmDialog as any;
      if (modal && modal.props.onConfirm) {
        modal.props.onConfirm();
      }
    });

    const confirmed = await confirmPromise!;
    expect(confirmed).toBe(true);
    expect(result.current.ConfirmDialog).toBeNull();
  });

  it('should resolve with false when cancel is clicked', async () => {
    const { result } = renderHook(() => useConfirm());

    let confirmPromise: Promise<boolean>;
    act(() => {
      confirmPromise = result.current.confirm({
        message: 'Are you sure?',
      });
    });

    // Resolve the promise by clicking cancel
    act(() => {
      const modal = result.current.ConfirmDialog as any;
      if (modal && modal.props.onClose) {
        modal.props.onClose();
      }
    });

    const confirmed = await confirmPromise!;
    expect(confirmed).toBe(false);
    expect(result.current.ConfirmDialog).toBeNull();
  });

  it('should use default title when not provided', () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        message: 'Are you sure?',
      });
    });

    const modal = result.current.ConfirmDialog as any;
    expect(modal?.props.title).toBe('Confirm');
  });

  it('should use custom confirm and cancel text', () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        message: 'Are you sure?',
        confirmText: 'Delete',
        cancelText: 'Keep',
      });
    });

    const modal = result.current.ConfirmDialog as any;
    expect(modal?.props.confirmText).toBe('Delete');
    expect(modal?.props.cancelText).toBe('Keep');
  });

  it('should use custom confirm variant', () => {
    const { result } = renderHook(() => useConfirm());

    act(() => {
      result.current.confirm({
        message: 'Are you sure?',
        confirmVariant: 'danger',
      });
    });

    const modal = result.current.ConfirmDialog as any;
    expect(modal?.props.confirmVariant).toBe('danger');
  });
});
