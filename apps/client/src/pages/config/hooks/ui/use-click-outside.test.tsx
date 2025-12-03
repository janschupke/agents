import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutside } from './use-click-outside';

describe('useClickOutside', () => {
  let container: HTMLDivElement;
  let element: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    element = document.createElement('div');
    container.appendChild(element);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should call handler when clicking outside element', () => {
    const handler = vi.fn();
    const ref = { current: element };

    renderHook(() => useClickOutside(ref, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith(event);

    document.body.removeChild(outsideElement);
  });

  it('should not call handler when clicking inside element', () => {
    const handler = vi.fn();
    const ref = { current: element };

    renderHook(() => useClickOutside(ref, handler));

    const event = new MouseEvent('mousedown', { bubbles: true });
    element.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should not call handler when disabled', () => {
    const handler = vi.fn();
    const ref = { current: element };

    renderHook(() => useClickOutside(ref, handler, false));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(outsideElement);
  });

  it('should cleanup event listener on unmount', () => {
    const handler = vi.fn();
    const ref = { current: element };
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useClickOutside(ref, handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('should handle null ref gracefully', () => {
    const handler = vi.fn();
    const ref = { current: null };

    renderHook(() => useClickOutside(ref, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    // Should not throw, but handler might be called
    expect(() => {
      outsideElement.dispatchEvent(event);
    }).not.toThrow();

    document.body.removeChild(outsideElement);
  });
});
