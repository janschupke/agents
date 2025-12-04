import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UseAutoNavigateToItemOptions<T> {
  /**
   * The base route path (e.g., '/chat' or '/config')
   * Navigation will only trigger when on this exact path
   */
  baseRoute: string;

  /**
   * The selected item ID to navigate to (null/undefined means no item selected)
   */
  selectedItemId: T | null | undefined;

  /**
   * Function to build the target route from the item ID
   */
  buildTargetRoute: (itemId: T) => string;

  /**
   * Whether data is currently loading
   */
  isLoading: boolean;

  /**
   * Optional dependencies that should reset the navigation flag
   * (e.g., when the parent entity changes, like agentId in chat)
   */
  resetDependencies?: unknown[];

  /**
   * Optional condition to check before navigating
   * Return false to prevent navigation
   */
  shouldNavigate?: (itemId: T) => boolean;
}

/**
 * Hook to automatically navigate to a specific item when accessing a base route
 * without an item ID. Useful for auto-selecting the most recent/first item.
 *
 * @example
 * // Auto-navigate to most recent agent when accessing /chat
 * useAutoNavigateToItem({
 *   baseRoute: ROUTES.CHAT,
 *   selectedItemId: currentAgentId,
 *   buildTargetRoute: ROUTES.CHAT_AGENT,
 *   isLoading: agentsLoading,
 *   resetDependencies: [],
 * });
 */
export function useAutoNavigateToItem<T extends number | string>({
  baseRoute,
  selectedItemId,
  buildTargetRoute,
  isLoading,
  resetDependencies = [],
  shouldNavigate,
}: UseAutoNavigateToItemOptions<T>) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasNavigatedRef = useRef(false);

  // Reset navigation flag when dependencies change
  // Note: resetDependencies is intentionally dynamic (passed as a prop)
  // ESLint cannot statically verify dynamic dependency arrays, so we disable the rule
  // This is safe because resetDependencies is explicitly provided by the caller
  useEffect(() => {
    hasNavigatedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetDependencies is intentionally dynamic
  }, resetDependencies);

  // Auto-navigate when conditions are met
  useEffect(() => {
    // Check if we're on the exact base route (not a sub-route with ID)
    const isOnBaseRoute = location.pathname === baseRoute;

    // Check if we have a valid selected item ID
    const hasSelectedItem =
      selectedItemId !== null && selectedItemId !== undefined;

    // Check if we should navigate (custom condition)
    const canNavigate =
      !shouldNavigate || (hasSelectedItem && shouldNavigate(selectedItemId));

    // Only navigate if:
    // 1. We're on the base route (exact path match)
    // 2. Data is loaded (not loading)
    // 3. A item was selected
    // 4. Custom condition passes (if provided)
    // 5. We haven't already navigated
    if (
      isOnBaseRoute &&
      !isLoading &&
      hasSelectedItem &&
      canNavigate &&
      !hasNavigatedRef.current
    ) {
      hasNavigatedRef.current = true;
      navigate(buildTargetRoute(selectedItemId), { replace: true });
    }
  }, [
    location.pathname,
    baseRoute,
    selectedItemId,
    isLoading,
    buildTargetRoute,
    navigate,
    shouldNavigate,
  ]);
}
