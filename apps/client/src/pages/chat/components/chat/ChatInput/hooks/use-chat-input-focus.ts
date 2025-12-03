import { useEffect, useRef, useCallback } from 'react';
import { ChatInputRef } from '../ChatInput';

/**
 * Determines if the input should be focusable based on current state
 */
function shouldInputBeFocusable(
  currentSessionId: number | null,
  messagesLoading: boolean,
  showChatPlaceholder: boolean
): boolean {
  return !!(
    currentSessionId &&
    !messagesLoading &&
    !showChatPlaceholder
  );
}

interface UseChatInputFocusOptions {
  chatInputRef: React.RefObject<ChatInputRef>;
  currentSessionId: number | null;
  messagesLoading: boolean;
  showChatPlaceholder: boolean;
  showTypingIndicator: boolean;
  isInputDisabled: boolean;
  agentId: number | null;
  onRefReady?: (ref: ChatInputRef) => void;
}

/**
 * Unified hook to manage chat input focus behavior
 * 
 * Uses callback ref pattern to detect when component mounts and focus immediately
 * when conditions are met.
 */
export function useChatInputFocus({
  chatInputRef,
  currentSessionId,
  messagesLoading,
  showChatPlaceholder,
  showTypingIndicator,
  isInputDisabled,
  agentId,
  onRefReady,
}: UseChatInputFocusOptions) {
  // Track previous values to detect transitions
  const prevSessionIdRef = useRef(currentSessionId);
  const prevAgentIdRef = useRef(agentId);
  const prevTypingIndicatorRef = useRef(showTypingIndicator);
  const prevDisabledRef = useRef(isInputDisabled);
  const prevIsFocusableRef = useRef(false);
  
  // Track if we should focus when ref becomes available
  const shouldFocusOnMountRef = useRef(false);
  const shouldFocusOnSessionChangeRef = useRef(false);
  const shouldFocusOnAgentChangeRef = useRef(false);
  const shouldFocusOnTypingIndicatorRef = useRef(false);
  const shouldFocusOnBecameFocusableRef = useRef(false);
  
  // Track if we've already focused from an effect (to prevent double-focus in onRefReady)
  const hasFocusedFromEffectRef = useRef(false);

  const isFocusable = shouldInputBeFocusable(
    currentSessionId,
    messagesLoading,
    showChatPlaceholder
  );

  // Store latest values in refs for use in callbacks
  const isInputDisabledRef = useRef(isInputDisabled);
  const isFocusableRef = useRef(isFocusable);
  useEffect(() => {
    isInputDisabledRef.current = isInputDisabled;
    isFocusableRef.current = isFocusable;
  }, [isInputDisabled, isFocusable]);

  // Track if we've scheduled a focus to prevent double-focus
  const focusScheduledRef = useRef(false);
  
  // Focus function - called when ref is ready
  const attemptFocus = useCallback(() => {
    if (chatInputRef.current && !isInputDisabledRef.current && isFocusableRef.current && !focusScheduledRef.current) {
      focusScheduledRef.current = true;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        focusScheduledRef.current = false;
        if (chatInputRef.current && !isInputDisabledRef.current && isFocusableRef.current) {
          chatInputRef.current.focus();
        }
      });
      return true;
    }
    return false;
  }, [chatInputRef]);

  // Callback that gets called when ChatInput mounts and ref is ready
  const handleRefReady = useCallback((ref: ChatInputRef) => {
    // Update the ref
    (chatInputRef as React.MutableRefObject<ChatInputRef | null>).current = ref;
    
    // Call external callback if provided
    onRefReady?.(ref);
    
    // Check if we have any pending focus requests
    const hasPendingFocus = 
      shouldFocusOnMountRef.current ||
      shouldFocusOnSessionChangeRef.current ||
      shouldFocusOnAgentChangeRef.current ||
      shouldFocusOnTypingIndicatorRef.current ||
      shouldFocusOnBecameFocusableRef.current;
    
    // Only focus if we have pending requests AND haven't already focused from an effect
    // OR if conditions are currently met and we haven't focused yet (component mounted after conditions became valid)
    const shouldFocus = (hasPendingFocus && !hasFocusedFromEffectRef.current) ||
      (!hasPendingFocus && !hasFocusedFromEffectRef.current && isFocusableRef.current && !isInputDisabledRef.current);
    
    if (shouldFocus) {
      attemptFocus();
      // Reset flags after focusing
      shouldFocusOnMountRef.current = false;
      shouldFocusOnSessionChangeRef.current = false;
      shouldFocusOnAgentChangeRef.current = false;
      shouldFocusOnTypingIndicatorRef.current = false;
      shouldFocusOnBecameFocusableRef.current = false;
      hasFocusedFromEffectRef.current = true;
    }
  }, [chatInputRef, onRefReady, attemptFocus]);

  // Effect 1: Initial mount - mark that we should focus
  useEffect(() => {
    if (isFocusable && !isInputDisabled) {
      shouldFocusOnMountRef.current = true;
      // If ref is already available, focus immediately and clear flag
      // This prevents double-focus when onRefReady is called later
      if (chatInputRef.current) {
        attemptFocus();
        shouldFocusOnMountRef.current = false;
        hasFocusedFromEffectRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Effect 2: Agent change - mark that we should focus
  useEffect(() => {
    const agentChanged = prevAgentIdRef.current !== agentId;
    if (agentChanged && agentId !== null) {
      shouldFocusOnAgentChangeRef.current = true;
      hasFocusedFromEffectRef.current = false; // Reset on agent change
      // If ref is already available, focus immediately and clear flag
      if (chatInputRef.current && isFocusable && !isInputDisabled) {
        attemptFocus();
        shouldFocusOnAgentChangeRef.current = false;
        hasFocusedFromEffectRef.current = true;
      }
    }
    prevAgentIdRef.current = agentId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, isFocusable, isInputDisabled, attemptFocus]);

  // Effect 3: Session change - mark that we should focus
  useEffect(() => {
    const sessionChanged = prevSessionIdRef.current !== currentSessionId;
    if (sessionChanged && isFocusable && !isInputDisabled) {
      shouldFocusOnSessionChangeRef.current = true;
      hasFocusedFromEffectRef.current = false; // Reset on session change
      // If ref is already available, focus immediately and clear flag
      if (chatInputRef.current) {
        attemptFocus();
        shouldFocusOnSessionChangeRef.current = false;
        hasFocusedFromEffectRef.current = true;
      }
    }
    prevSessionIdRef.current = currentSessionId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId, isFocusable, isInputDisabled, attemptFocus]);

  // Effect 4: Conditions became focusable - mark that we should focus
  useEffect(() => {
    const becameFocusable = !prevIsFocusableRef.current && isFocusable;
    if (becameFocusable && !isInputDisabled) {
      shouldFocusOnBecameFocusableRef.current = true;
      // If ref is already available, focus immediately and clear flag
      if (chatInputRef.current) {
        attemptFocus();
        shouldFocusOnBecameFocusableRef.current = false;
      }
    }
    prevIsFocusableRef.current = isFocusable;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusable, isInputDisabled, attemptFocus]);

  // Effect 5: Typing indicator transition (disabled -> enabled) - mark that we should focus
  useEffect(() => {
    const wasDisabled = prevTypingIndicatorRef.current === true;
    const isNowEnabled = showTypingIndicator === false;
    const wasInputDisabled = prevDisabledRef.current === true;
    const isNowInputEnabled = isInputDisabled === false;

    if (
      isFocusable &&
      ((wasDisabled && isNowEnabled) || (wasInputDisabled && isNowInputEnabled))
    ) {
      shouldFocusOnTypingIndicatorRef.current = true;
      // If ref is already available, focus immediately and clear flag
      if (chatInputRef.current) {
        attemptFocus();
        shouldFocusOnTypingIndicatorRef.current = false;
      }
    }

    prevTypingIndicatorRef.current = showTypingIndicator;
    prevDisabledRef.current = isInputDisabled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTypingIndicator, isInputDisabled, isFocusable, attemptFocus]);

  // Return callback ref handler
  return handleRefReady;
}
