# Routing Improvements Refactoring Plan

## Overview

This document outlines the refactoring plan to enhance the routing system with nested routes and URL parameters. The goal is to move from simple 1-level routes to a more sophisticated routing structure that includes session and agent IDs in URLs, improving shareability, bookmarking, and state management.

## Current State Analysis

### Current Routes

Currently, the application uses simple 1-level routes:

- `/` → Redirects to `/chat`
- `/chat` → Chat interface (agent and session selected via state/localStorage)
- `/config` → Agent configuration (agent selected via state/localStorage)
- `/profile` → User profile

### Current State Management

#### LocalStorage Persistence

The application currently persists state in localStorage via `LocalStorageManager`:

1. **`selectedAgentId_chat`**: Selected agent ID for chat view
2. **`selectedAgentId_config`**: Selected agent ID for config view
3. **`selectedSessionId`**: Selected session ID

#### Context State (`AppContext`)

- `selectedAgentId`: Agent ID for chat (synced with localStorage)
- `selectedSessionId`: Session ID (synced with localStorage)

#### Component State

- **ChatAgent**: Uses `useChatAgent` hook which reads from `AppContext` and localStorage
- **AgentConfig**: Uses `useAgentSelection` hook which manages its own state + localStorage
- **Session Management**: `useChatSession` manages session state internally, auto-selects most recent session

### Current Issues

1. **No URL Parameters**: Agent and session IDs are not in URLs, making it impossible to:
   - Share direct links to specific chats
   - Bookmark specific agent/session combinations
   - Use browser back/forward effectively
   - Deep link into the application

2. **State Duplication**: 
   - Agent selection stored separately for chat vs config views
   - Session state managed separately from URL
   - Complex synchronization between localStorage, context, and component state

3. **Loading State Management**:
   - Loading states exist but could be more granular
   - No clear loading states when navigating to invalid IDs
   - Error states for missing agents/sessions not well handled

4. **New Agent Flow**:
   - Currently handled via local state (`localAgents` array with negative IDs)
   - No dedicated route for creating new agents
   - New agent state lost on navigation

## Target Architecture

### New Route Structure

```
/ → Redirect to /chat
/chat → Chat interface (no agent/session - shows empty state or selects default)
/chat/:sessionId → Chat interface with specific session
/config → Agent config (no agent - shows empty state or selects default)
/config/:agentId → Agent config for specific agent
/config/new → New agent creation form (frontend-only, no backend agent yet)
/profile → User profile (unchanged)
```

### URL Parameter Strategy

1. **Session IDs in Chat URLs**: `/chat/:sessionId`
   - Session ID determines which agent to use (sessions belong to agents)
   - **Challenge**: Session interface doesn't include agentId, so we need to:
     - Option A: Add new API endpoint `GET /api/sessions/:sessionId` that returns session with agentId
     - Option B: Fetch all agents and their sessions to find the match (less efficient)
     - Option C: Include agentId in session object (backend change)
   - If session doesn't exist, show error/redirect
   - If no sessionId, show empty state or auto-select most recent

2. **Agent IDs in Config URLs**: `/config/:agentId`
   - Direct access to specific agent configuration
   - If agent doesn't exist, show error/redirect
   - If no agentId, show empty state or auto-select first agent

3. **New Agent Route**: `/config/new`
   - Frontend-only route for creating new agents
   - No backend agent exists yet
   - **Alternative to negative IDs**: Use a special identifier (e.g., `'new'` string) or null state
   - Store new agent form data in component state or a temporary store
   - Navigate to `/config/:agentId` after successful save

### State Management Strategy

With URL parameters, we can simplify state management while maintaining separate selections:

1. **LocalStorage for Last Selected (per section)**:
   - Keep `selectedAgentId_chat` and `selectedAgentId_config` in localStorage
   - These represent the "last selected" agent in each section
   - When navigating to `/chat` or `/config` without ID, redirect to last selected
   - **Important**: Chat and config can have different agents selected - this is valid
   - Remove `selectedSessionId` from localStorage (session comes from URL)

2. **Simplify Context**:
   - Remove `selectedAgentId` and `selectedSessionId` from `AppContext`
   - Context can focus on other app-wide state if needed
   - Or potentially remove `AppContext` entirely if not needed

3. **URL as Source of Truth**:
   - Read agent/session IDs from URL params when present
   - When no ID in URL, use last selected from localStorage and redirect
   - Update URL when selection changes
   - Navigate programmatically instead of setting state

## Implementation Plan

### Phase 1: Update Route Definitions

1. **Update App.tsx Routes**
   - Add nested routes: `/chat/:sessionId` and `/config/:agentId`
   - Add `/config/new` route
   - Keep existing routes for backward compatibility (with redirects)

2. **Create Route Components**
   - `ChatRoute` component that handles `/chat` and `/chat/:sessionId`
   - `ConfigRoute` component that handles `/config`, `/config/:agentId`, and `/config/new`
   - Extract route-specific logic from current components

### Phase 2: Update Chat Routes

3. **Refactor ChatAgent Component**
   - Read `sessionId` from URL params using `useParams`
   - Derive `agentId` from session (sessions belong to agents)
   - Navigate to `/chat/:sessionId` when session selected
   - Navigate to `/chat` when session cleared
   - Handle loading states for session/agent lookup

4. **Update Session Selection Logic**
   - Replace `setCurrentSessionId` with `navigate('/chat/:sessionId')`
   - Remove session state management from `useChatSession`
   - Update `useChatSession` to read from URL params

5. **Handle Edge Cases**
   - Invalid sessionId: Show error or redirect to `/chat`
   - Missing sessionId: Show empty state or auto-select most recent
   - Session belongs to different agent: Handle gracefully

### Phase 3: Update Config Routes

6. **Refactor AgentConfig Component**
   - Read `agentId` from URL params using `useParams`
   - Handle `/config/new` route for new agent creation
   - Navigate to `/config/:agentId` when agent selected
   - Navigate to `/config` when agent cleared
   - Handle loading states for agent lookup

7. **Update Agent Selection Logic**
   - Replace `setCurrentAgentId` with `navigate('/config/:agentId')`
   - Remove agent state management from `useAgentSelection`
   - Update `useAgentSelection` to read from URL params

8. **Handle New Agent Route**
   - Create `NewAgentConfig` component for `/config/new`
   - Use local state for new agent (negative IDs)
   - Navigate to `/config/:agentId` after successful save
   - Handle navigation away from `/config/new` (warn if unsaved)

### Phase 4: Loading States Enhancement

9. **Add Granular Loading States**
   - Loading state for session lookup: `loadingSession`
   - Loading state for agent lookup: `loadingAgent`
   - Loading state for session's agent lookup: `loadingSessionAgent`
   - Error states for invalid IDs: `sessionNotFound`, `agentNotFound`

10. **Update Components to Show Loading States**
    - Show skeleton/loading UI while fetching session/agent data
    - Show error UI for invalid IDs
    - Show empty state when no ID provided and no default available

### Phase 5: State Management Updates

11. **Update localStorage Strategy**
    - Keep `selectedAgentId_chat` and `selectedAgentId_config` in `LocalStorageManager`
    - Remove `selectedSessionId` from localStorage (comes from URL)
    - Use these as "last selected" fallbacks when navigating without ID
    - Update tests

12. **Simplify AppContext**
    - Remove `selectedAgentId` and `selectedSessionId` from context
    - Remove related hooks (`useSelectedAgent`, etc.)
    - Keep context if other state is needed, or remove entirely

13. **Update Hooks**
    - Update `useChatAgent` to read from URL params, fallback to localStorage
    - Update `useAgentSelection` to read from URL params, fallback to localStorage
    - Update `useChatSession` to read from URL params
    - Remove session localStorage synchronization logic

### Phase 6: Navigation Updates

14. **Update Navigation Links**
    - Update top nav links to use base routes (`/chat`, `/config`)
    - Update sidebar item clicks to navigate to specific routes
    - Update "New" buttons to navigate to `/config/new` or create session and navigate

15. **Update Programmatic Navigation**
    - Replace all `setSelectedAgentId` calls with `navigate('/config/:agentId')`
    - Replace all `setCurrentSessionId` calls with `navigate('/chat/:sessionId')`
    - Update redirects to use proper routes

## Detailed Implementation

### Route Constants

First, define route constants to avoid literals:

```typescript
// constants/routes.constants.ts
export const ROUTES = {
  ROOT: '/',
  CHAT: '/chat',
  CHAT_SESSION: (sessionId: number) => `/chat/${sessionId}`,
  CONFIG: '/config',
  CONFIG_NEW: '/config/new',
  CONFIG_AGENT: (agentId: number) => `/config/${agentId}`,
  PROFILE: '/profile',
} as const;

// Helper to check if route matches pattern
export const isChatRoute = (path: string) => path.startsWith('/chat');
export const isConfigRoute = (path: string) => path.startsWith('/config');
```

### Route Definitions

```typescript
// App.tsx
import { ROUTES } from './constants/routes.constants';

<Routes>
  <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.CHAT} replace />} />
  
  {/* Chat routes */}
  <Route path={ROUTES.CHAT} element={<ChatRoute />} />
  <Route path="/chat/:sessionId" element={<ChatRoute />} />
  
  {/* Config routes */}
  <Route path={ROUTES.CONFIG} element={<ConfigRoute />} />
  <Route path={ROUTES.CONFIG_NEW} element={<ConfigRoute />} />
  <Route path="/config/:agentId" element={<ConfigRoute />} />
  
  {/* Profile route */}
  <Route path={ROUTES.PROFILE} element={<UserProfile />} />
</Routes>
```

### ChatRoute Component

```typescript
// pages/chat/ChatRoute.tsx
import { useParams, Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import ChatAgent from './components/chat/ChatAgent';
import { useChatRoute } from './hooks/use-chat-route';

export default function ChatRoute() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const { agentId, loading, error } = useChatRoute(sessionId);
  
  // Business logic moved to hook
  if (loading) {
    return <ChatAgent loading={true} />;
  }
  
  if (error || (sessionId && !agentId)) {
    return <ChatAgent error={error || 'Session not found'} />;
  }
  
  if (!sessionId) {
    return <ChatAgent />; // Handles empty state internally
  }
  
  const parsedSessionId = parseInt(sessionId, 10);
  if (isNaN(parsedSessionId)) {
    return <Navigate to={ROUTES.CHAT} replace />;
  }
  
  return <ChatAgent sessionId={parsedSessionId} agentId={agentId} />;
}
```

### ConfigRoute Component

```typescript
// pages/config/ConfigRoute.tsx
import { useParams, Navigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import AgentConfig from './components/agent/AgentConfig';
import NewAgentConfig from './components/agent/NewAgentConfig';
import { useConfigRoute } from './hooks/use-config-route';

export default function ConfigRoute() {
  const { agentId } = useParams<{ agentId?: string }>();
  const { loading, error, lastSelectedAgentId } = useConfigRoute(agentId);
  
  // Business logic moved to hook
  if (loading) {
    return <AgentConfig loading={true} />;
  }
  
  // Handle new agent route
  if (agentId === 'new') {
    return <NewAgentConfig />;
  }
  
  // If no agentId, redirect to last selected or show empty state
  if (!agentId) {
    if (lastSelectedAgentId) {
      return <Navigate to={ROUTES.CONFIG_AGENT(lastSelectedAgentId)} replace />;
    }
    return <AgentConfig />; // Handles empty state internally
  }
  
  const parsedAgentId = parseInt(agentId, 10);
  if (isNaN(parsedAgentId)) {
    return <Navigate to={ROUTES.CONFIG} replace />;
  }
  
  if (error) {
    return <AgentConfig agentId={parsedAgentId} error={error} />;
  }
  
  return <AgentConfig agentId={parsedAgentId} />;
}
```

### Updated ChatAgent Component

```typescript
// pages/chat/components/chat/ChatAgent.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from '../../../../constants/routes.constants';
import { useChatAgentNavigation } from '../../hooks/use-chat-agent-navigation';
import { useChatAgentData } from '../../hooks/use-chat-agent-data';
import ChatErrorState from './ChatErrorState';
import ChatLoadingState from './ChatLoadingState';
import ChatEmptyState from './ChatEmptyState';

interface ChatAgentProps {
  sessionId?: number; // From route params
  agentId?: number; // From route params
  loading?: boolean;
  error?: string;
}

export default function ChatAgent({ 
  sessionId: propSessionId, 
  agentId: propAgentId,
  loading: propLoading,
  error: propError,
}: ChatAgentProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { sessionId: urlSessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  
  // Business logic moved to hooks
  const { sessionId, agentId, loading, error } = useChatAgentData({
    propSessionId,
    urlSessionId,
    propAgentId,
  });
  
  const { handleSessionSelect, handleNewSession } = useChatAgentNavigation({
    agentId,
    navigate,
  });
  
  // Loading state
  if (propLoading || loading) {
    return <ChatLoadingState />;
  }
  
  // Error state - show in page content
  if (propError || error) {
    return (
      <PageContainer>
        <Container>
          <PageHeader title={t('chat.title')} />
          <PageContent>
            <ChatErrorState message={propError || error || t('chat.errors.sessionNotFound')} />
          </PageContent>
        </Container>
      </PageContainer>
    );
  }
  
  if (sessionId && !agentId) {
    return (
      <PageContainer>
        <Container>
          <PageHeader title={t('chat.title')} />
          <PageContent>
            <ChatErrorState message={t('chat.errors.sessionNotFound')} />
          </PageContent>
        </Container>
      </PageContainer>
    );
  }
  
  if (!agentId) {
    return <ChatEmptyState />;
  }
  
  // Rest of component...
}
```

### Updated AgentConfig Component

```typescript
// pages/config/components/agent/AgentConfig.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from '../../../../constants/routes.constants';
import { useAgentConfigNavigation } from '../../hooks/use-agent-config-navigation';
import { useAgentConfigData } from '../../hooks/use-agent-config-data';
import AgentConfigErrorState from './AgentConfigErrorState';
import AgentConfigLoadingState from './AgentConfigLoadingState';

interface AgentConfigProps {
  agentId?: number;
  loading?: boolean;
  error?: string;
}

export default function AgentConfig({ 
  agentId: propAgentId,
  loading: propLoading,
  error: propError,
}: AgentConfigProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { agentId: urlAgentId } = useParams<{ agentId?: string }>();
  const navigate = useNavigate();
  
  // Business logic moved to hooks
  const { agentId, loading, error } = useAgentConfigData({
    propAgentId,
    urlAgentId,
  });
  
  const { handleAgentSelect, handleNewAgent, handleSave } = useAgentConfigNavigation({
    navigate,
  });
  
  // Loading state
  if (propLoading || loading) {
    return <AgentConfigLoadingState />;
  }
  
  // Error state - show in page content
  if (propError || error) {
    return (
      <PageContainer>
        <Container>
          <PageHeader title={t('config.title')} />
          <PageContent>
            <AgentConfigErrorState message={propError || error || t('config.errors.agentNotFound')} />
          </PageContent>
        </Container>
      </PageContainer>
    );
  }
  
  if (agentId && error) {
    return (
      <PageContainer>
        <Container>
          <PageHeader title={t('config.title')} />
          <PageContent>
            <AgentConfigErrorState message={t('config.errors.agentNotFound')} />
          </PageContent>
        </Container>
      </PageContainer>
    );
  }
  
  // Rest of component...
}
```

### NewAgentConfig Component

```typescript
// pages/config/components/agent/NewAgentConfig.tsx
import { useNavigate } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from '../../../../constants/routes.constants';
import { useConfirm } from '../../../../hooks/useConfirm';
import { useNewAgentForm } from '../../hooks/use-new-agent-form';
import { useNewAgentNavigation } from '../../hooks/use-new-agent-navigation';
import { useUnsavedChangesWarning } from '../../../../hooks/use-unsaved-changes-warning';

export default function NewAgentConfig() {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const navigate = useNavigate();
  const { confirm, ConfirmDialog } = useConfirm();
  
  // Business logic moved to hooks
  const { formData, setFormData, hasUnsavedChanges } = useNewAgentForm();
  const { handleSave, handleCancel } = useNewAgentNavigation({
    formData,
    navigate,
    confirm,
  });
  
  // Centralized unsaved changes warning
  useUnsavedChangesWarning(hasUnsavedChanges);
  
  // Rest of component - just UI...
}
```

### useNewAgentForm Hook

```typescript
// pages/config/hooks/use-new-agent-form.ts
import { useState } from 'react';

export function useNewAgentForm() {
  // No negative IDs - use null or special identifier
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: '',
    description: '',
    // ... other fields
  });
  
  const hasUnsavedChanges = Boolean(
    formData.name || formData.description || /* other fields */
  );
  
  return {
    formData,
    setFormData,
    hasUnsavedChanges,
  };
}
```

### useNewAgentNavigation Hook

```typescript
// pages/config/hooks/use-new-agent-navigation.ts
import { useNavigate } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { ROUTES } from '../../../../constants/routes.constants';
import { useCreateAgent } from '../../../../hooks/mutations/use-agent-mutations';
import { useToast } from '../../../../contexts/ToastContext';

export function useNewAgentNavigation({
  formData,
  navigate,
  confirm,
}: {
  formData: Partial<Agent>;
  navigate: NavigateFunction;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { showToast } = useToast();
  const createAgentMutation = useCreateAgent();
  
  const handleSave = async () => {
    try {
      const savedAgent = await createAgentMutation.mutateAsync(formData);
      showToast(t('config.messages.agentCreated'), 'success');
      navigate(ROUTES.CONFIG_AGENT(savedAgent.id), { replace: true });
    } catch (error) {
      showToast(error.message || t('config.errors.createFailed'), 'error');
    }
  };
  
  const handleCancel = async () => {
    const hasChanges = Boolean(formData.name || formData.description);
    if (hasChanges) {
      const confirmed = await confirm({
        title: t('config.confirm.unsavedChangesTitle'),
        message: t('config.confirm.unsavedChangesMessage'),
        confirmText: t('common.leave'),
        cancelText: t('common.cancel'),
      });
      if (!confirmed) {
        return;
      }
    }
    navigate(ROUTES.CONFIG);
  };
  
  return { handleSave, handleCancel };
}
```

### Loading States Enhancement

#### Option A: New API Endpoint (Recommended)

```typescript
// services/chat.service.ts
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api.constants';
import { getAuthHeaders } from './api-client';

export class ChatService {
  // Add new method
  static async getSessionWithAgent(sessionId: number): Promise<{ session: Session; agentId: number }> {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
      headers: await getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch session' }));
      throw new Error(error.message || 'Failed to fetch session');
    }
    return response.json();
  }
}

// hooks/use-session-with-agent.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../queries/query-keys';
import { ChatService } from '../services/chat.service';
import { useToast } from '../contexts/ToastContext';
import { useTranslation, I18nNamespace } from '@openai/i18n';

export function useSessionWithAgent(sessionId: number | null) {
  const { showToast } = useToast();
  const { t } = useTranslation(I18nNamespace.CLIENT);
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.sessions.withAgent(sessionId!),
    queryFn: () => ChatService.getSessionWithAgent(sessionId!),
    enabled: sessionId !== null && sessionId > 0,
    onError: (error: Error) => {
      showToast(error.message || t('chat.errors.fetchSessionFailed'), 'error');
    },
  });
  
  return {
    session: data?.session,
    agentId: data?.agentId,
    loading: isLoading,
    error: isError ? (error as Error)?.message : null,
  };
}
```

### Query Keys Update

```typescript
// hooks/queries/query-keys.ts
export const queryKeys = {
  // ... existing keys
  sessions: {
    all: [QueryKey.SESSIONS] as const,
    withAgent: (sessionId: number) => 
      [...queryKeys.sessions.all, 'with-agent', sessionId] as const,
  },
} as const;
```

#### Option B: Fetch All Agents (Fallback)

```typescript
// hooks/use-session-with-agent.ts
export function useSessionWithAgent(sessionId: number | null) {
  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  
  // Fetch sessions for all agents to find the one containing our sessionId
  const sessionQueries = agents.map(agent => 
    useAgentSessions(agent.id)
  );
  
  const loading = loadingAgents || sessionQueries.some(q => q.isLoading);
  
  // Find which agent has this session
  const agentWithSession = agents.find((agent, index) => {
    const sessions = sessionQueries[index]?.data || [];
    return sessions.some(s => s.id === sessionId);
  });
  
  return {
    session: agentWithSession ? sessionQueries[agents.indexOf(agentWithSession)]?.data?.find(s => s.id === sessionId) : null,
    agentId: agentWithSession?.id || null,
    loading,
    error: !loading && sessionId !== null && !agentWithSession,
  };
}
```

**Recommendation**: Use Option A (new API endpoint) for better performance and simplicity.

### State Management Cleanup

#### Update LocalStorageManager

```typescript
// utils/localStorage.ts
// KEEP these methods (for last selected fallback):
// - getSelectedAgentIdChat()
// - setSelectedAgentIdChat()
// - getSelectedAgentIdConfig()
// - setSelectedAgentIdConfig()

// REMOVE:
// - getSelectedSessionId()
// - setSelectedSessionId() (session comes from URL)

// KEEP if needed:
// - clearAll() (if other storage exists)
// - Any other non-ID related storage
```

#### Simplify AppContext

```typescript
// contexts/AppContext.tsx
// Option 1: Remove entirely if no other state needed
// Option 2: Keep for other app-wide state (e.g., theme, preferences)

interface AppContextValue {
  // Remove: selectedAgentId, selectedSessionId
  // Add other app-wide state if needed
}

// Remove hooks:
// - useSelectedAgent()
// - useSelectedSession()
```

#### Update Hooks

```typescript
// hooks/use-chat-agent.ts
export function useChatAgent({ sessionId }: { sessionId: number | null }) {
  // Get agentId from session
  const { agentId, loading } = useSessionWithAgent(sessionId);
  
  return {
    actualAgentId: agentId,
    loadingAgents: loading,
  };
}

// hooks/use-agent-selection.ts
export function useAgentSelection({ agentId }: { agentId: number | null }) {
  // Read from URL params instead of localStorage
  const { data: agents = [], isLoading: loadingAgents } = useAgents();
  
  return {
    currentAgentId: agentId, // From URL
    agents,
    loadingAgents,
  };
}
```

## Migration Strategy

### Backward Compatibility

1. **Redirect Old Routes**: 
   - `/chat` → Keep, but read from localStorage `selectedAgentId_chat` and redirect to last selected session or show empty state
   - `/config` → Keep, but read from localStorage `selectedAgentId_config` and redirect to last selected agent or show empty state

2. **LocalStorage Strategy**:
   - Keep `selectedAgentId_chat` and `selectedAgentId_config` for "last selected" fallback
   - When navigating to `/chat` or `/config` without ID, redirect to last selected if available
   - Update localStorage when user selects different agent/session
   - Remove `selectedSessionId` (comes from URL)

### Step-by-Step Migration

1. **Add new routes alongside old ones** (non-breaking)
2. **Update components to read from URL params** (with fallback to localStorage)
3. **Update navigation to use new routes** (gradually)
4. **Remove localStorage synchronization** (after all navigation updated)
5. **Remove old route handlers** (after migration complete)
6. **Remove localStorage migration code** (after sufficient time)

## Benefits

1. **Shareability**: Users can share direct links to specific chats/agents
2. **Bookmarking**: Browser bookmarks work correctly
3. **Browser Navigation**: Back/forward buttons work as expected
4. **Deep Linking**: Can link directly to specific resources
5. **State Simplification**: Less state to manage, URL is source of truth
6. **Better UX**: Clear loading/error states for invalid IDs
7. **SEO**: URLs are more meaningful (if applicable)

## Edge Cases and Considerations

### Invalid IDs

- **Invalid sessionId**: Show clear error message in PageContent (not redirect), use translation keys
- **Invalid agentId**: Show clear error message in PageContent (not redirect), use translation keys
- **Session belongs to deleted agent**: Show error message, allow navigation to `/chat`
- **Agent deleted while viewing**: Show error message, allow navigation to `/config`
- **All error messages**: Use translation keys, show toast notification in addition to page state

### Navigation

- **Navigating away from `/config/new` with unsaved changes**: Warn user
- **Browser back from `/config/new`**: Should go to previous route, not create new agent
- **Direct navigation to `/chat/:sessionId`**: Should load session and agent correctly

### Loading States

- **Loading session**: Show skeleton/loading UI
- **Loading agent from session**: Show loading UI
- **Loading agent config**: Show loading UI
- **Concurrent loading**: Handle multiple loading states gracefully

### Empty States

- **No sessionId in `/chat`**: Show empty state or auto-select most recent
- **No agentId in `/config`**: Show empty state or auto-select first agent
- **No agents available**: Show appropriate empty state

### New Agent Flow

- **Creating new agent**: Use `/config/new` route
- **No negative IDs**: Use null/undefined state or special identifier instead of negative IDs
- **Saving new agent**: Navigate to `/config/:agentId`, show success toast
- **Canceling new agent**: Use `useConfirm` hook (not browser confirm), navigate to `/config`
- **Unsaved changes**: Use centralized `useUnsavedChangesWarning` hook (not component-level beforeunload)

## Testing Strategy

1. **Route Testing**:
   - Test all route combinations
   - Test invalid IDs
   - Test navigation between routes

2. **State Testing**:
   - Verify localStorage is not used for IDs
   - Verify URL params are read correctly
   - Verify navigation updates URL

3. **Loading State Testing**:
   - Test loading states for all scenarios
   - Test error states
   - Test empty states

4. **Migration Testing**:
   - Test backward compatibility
   - Test localStorage migration
   - Test route redirects

## Timeline Estimate

- Phase 1 (Route Definitions): 2-3 hours
- Phase 2 (Chat Routes): 4-5 hours
- Phase 3 (Config Routes): 4-5 hours
- Phase 4 (Loading States): 2-3 hours
- Phase 5 (State Cleanup): 3-4 hours
- Phase 6 (Navigation Updates): 2-3 hours
- Testing and Bug Fixes: 4-6 hours

**Total**: ~21-29 hours

## Additional Implementation Details

### Centralized Unsaved Changes Warning

```typescript
// hooks/use-unsaved-changes-warning.ts
import { useEffect } from 'react';

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);
}
```

### Translation Keys

Add to `packages/i18n/src/locales/en.json`:

```json
{
  "client": {
    "chat": {
      "title": "Chat",
      "errors": {
        "sessionNotFound": "Session not found",
        "fetchSessionFailed": "Failed to fetch session"
      }
    },
    "config": {
      "title": "Agent Configuration",
      "errors": {
        "agentNotFound": "Agent not found",
        "createFailed": "Failed to create agent"
      },
      "messages": {
        "agentCreated": "Agent created successfully"
      },
      "confirm": {
        "unsavedChangesTitle": "Unsaved Changes",
        "unsavedChangesMessage": "You have unsaved changes. Are you sure you want to leave?"
      }
    }
  },
  "common": {
    "leave": "Leave",
    "cancel": "Cancel"
  }
}
```

### Business Logic in Hooks

All business logic should be extracted to hooks:

- `use-chat-route.ts`: Handles chat route logic (session lookup, agent derivation)
- `use-config-route.ts`: Handles config route logic (agent lookup, last selected fallback)
- `use-chat-agent-data.ts`: Fetches and manages chat agent data
- `use-chat-agent-navigation.ts`: Handles chat navigation logic
- `use-agent-config-data.ts`: Fetches and manages agent config data
- `use-agent-config-navigation.ts`: Handles config navigation logic
- `use-new-agent-form.ts`: Manages new agent form state
- `use-new-agent-navigation.ts`: Handles new agent navigation and save logic

## Success Criteria

- [ ] All routes defined as constants (no literals)
- [ ] Session IDs in chat URLs (`/chat/:sessionId`)
- [ ] Agent IDs in config URLs (`/config/:agentId`)
- [ ] New agent route (`/config/new`) working without negative IDs
- [ ] Loading states present and working
- [ ] Error states for invalid IDs shown in PageContent with translation keys
- [ ] localStorage kept for last selected (chat and config separate)
- [ ] AppContext simplified or removed
- [ ] All navigation uses route constants
- [ ] All strings use translation keys
- [ ] All business logic in hooks/services
- [ ] Unsaved changes warning centralized
- [ ] Error toasts shown in addition to page state
- [ ] Query keys in constants
- [ ] Backward compatibility maintained
- [ ] Tests pass
- [ ] Code review completed
