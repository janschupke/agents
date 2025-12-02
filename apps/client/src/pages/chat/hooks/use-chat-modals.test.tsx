import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatModals } from './use-chat-modals';

describe('useChatModals', () => {
  it('should initialize with closed modals', () => {
    const { result } = renderHook(() => useChatModals());

    expect(result.current.jsonModal.isOpen).toBe(false);
    expect(result.current.sessionNameModal.isOpen).toBe(false);
  });

  it('should open and close JSON modal', () => {
    const { result } = renderHook(() => useChatModals());

    act(() => {
      result.current.openJsonModal('Test Title', { key: 'value' });
    });

    expect(result.current.jsonModal.isOpen).toBe(true);
    expect(result.current.jsonModal.title).toBe('Test Title');
    expect(result.current.jsonModal.data).toEqual({ key: 'value' });

    act(() => {
      result.current.closeJsonModal();
    });

    expect(result.current.jsonModal.isOpen).toBe(false);
    expect(result.current.jsonModal.title).toBe('');
    expect(result.current.jsonModal.data).toBeNull();
  });

  it('should open and close session name modal', () => {
    const { result } = renderHook(() => useChatModals());

    act(() => {
      result.current.openSessionNameModal(5);
    });

    expect(result.current.sessionNameModal.isOpen).toBe(true);
    expect(result.current.sessionNameModal.sessionId).toBe(5);

    act(() => {
      result.current.closeSessionNameModal();
    });

    expect(result.current.sessionNameModal.isOpen).toBe(false);
    expect(result.current.sessionNameModal.sessionId).toBeNull();
  });

  it('should handle multiple modal operations', () => {
    const { result } = renderHook(() => useChatModals());

    act(() => {
      result.current.openJsonModal('Title 1', { data: 1 });
    });

    expect(result.current.jsonModal.isOpen).toBe(true);

    act(() => {
      result.current.openSessionNameModal(10);
    });

    expect(result.current.jsonModal.isOpen).toBe(true);
    expect(result.current.sessionNameModal.isOpen).toBe(true);

    act(() => {
      result.current.closeJsonModal();
    });

    expect(result.current.jsonModal.isOpen).toBe(false);
    expect(result.current.sessionNameModal.isOpen).toBe(true);
  });
});
