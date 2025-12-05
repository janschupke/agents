# Admin UI Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan for the admin UI to improve code reusability, consistency, and user experience. The plan addresses form sharing, table components, navigation flows, and UI component standardization.

## Goals

1. **Agent Archetypes UI** - Allow full creation of agent archetype with all fields from the model
2. **Agent Edit UI** - Allow full edits with all fields
3. **Shared Forms** - Create reusable form components that can be shared between archetype creation and agent editing
4. **AI Logs Expand** - Fix expand functionality to show request + response in ellipsis, with full content when expanded
5. **Table Component** - Add reusable table component to UI package using TanStack Table
6. **Tabbed Panel Component** - Create tabbed panel component matching admin navigation style
7. **Detail-Edit Flow** - Improve navigation so back buttons go directly to table/list
8. **User Detail/Edit Layout** - Fix broken layout in user detail/edit pages

---

## 1. Shared Agent Form Component

### Current State
- `AgentArchetypeForm` (`apps/admin/src/components/AgentArchetypeForm.tsx`) - 705 lines, handles archetype creation/editing
- `AgentEditPage` (`apps/admin/src/pages/AgentEditPage.tsx`) - 207 lines, handles agent editing with limited fields
- Forms are duplicated and don't share common logic

### Target State
- Create shared `AgentForm` component in `apps/admin/src/components/AgentForm.tsx`
- Support both archetype and agent editing modes
- Archetype mode includes additional fields: `system_prompt` and `behavior_rules` (archetype rules)
- All fields from the model should be editable

### Implementation Steps

#### 1.1 Create Shared AgentForm Component

**Location**: `apps/admin/src/components/AgentForm.tsx`

**Create Form Mode Enum**:
```typescript
// apps/admin/src/types/agent-form.types.ts
export enum AgentFormMode {
  ARCHETYPE = 'archetype',
  AGENT = 'agent',
}
```

**Props Interface**:
```typescript
interface AgentFormProps {
  mode: AgentFormMode;
  initialData?: AgentFormData | null;
  onSubmit: (data: AgentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface AgentFormData {
  // Basic fields
  name: string;
  description?: string;
  avatarUrl?: string;
  agentType?: AgentType;
  language?: string;
  
  // Configuration fields
  temperature?: number;
  systemPrompt?: string; // Only for archetype mode
  behaviorRules?: string[]; // Only for archetype mode
  model?: string;
  maxTokens?: number;
  responseLength?: ResponseLength;
  
  // Personality fields
  age?: number;
  gender?: Gender;
  personality?: PersonalityType;
  sentiment?: Sentiment;
  interests?: string[];
  availability?: Availability;
}
```

**Key Features**:
- Conditional rendering based on `mode` prop
- Show `systemPrompt` and `behaviorRules` fields only when `mode === AgentFormMode.ARCHETYPE`
- Use semantic color classes from `@openai/ui`
- Extract validation logic to separate utility
- Use form components from `@openai/ui` (Input, Textarea, etc.)

#### 1.2 Refactor AgentArchetypeForm

**Changes**:
- Replace `AgentArchetypeForm` with wrapper that uses `AgentForm`
- Pass `mode={AgentFormMode.ARCHETYPE}` to `AgentForm`
- Handle archetype-specific API calls in the wrapper

**File**: `apps/admin/src/components/AgentArchetypeForm.tsx`
```typescript
// Simplified wrapper around AgentForm
export default function AgentArchetypeForm({ archetype, onSave, onCancel }) {
  // Handle archetype-specific mutations
  // Map archetype data to AgentFormData
  // Pass to AgentForm with mode="archetype"
}
```

#### 1.3 Refactor AgentEditPage

**Changes**:
- Replace inline form with `AgentForm` component
- Pass `mode={AgentFormMode.AGENT}` to `AgentForm`
- Ensure all agent fields are editable (currently missing many config fields)
- Update query keys to use `queryKeys` enum instead of string literals

**File**: `apps/admin/src/pages/AgentEditPage.tsx`
- Use `AgentForm` instead of inline form
- Map agent data to `AgentFormData` format
- Handle agent-specific API calls

#### 1.4 Update Agent Form to Support All Fields

**Current Missing Fields in AgentEditPage**:
- `temperature`
- `system_prompt` (should be editable for agents too, but not archetype rules)
- `model`
- `max_tokens`
- `response_length`
- `age`
- `gender`
- `personality`
- `sentiment`
- `interests`
- `availability`

**Note**: Agents can have `system_prompt` in configs, but archetypes have both `system_prompt` AND `behavior_rules` (archetype-specific rules).

---

## 2. AI Request Logs Table - Expand Functionality

### Current State
- `AiRequestLogTable` (`apps/admin/src/components/AiRequestLogTable.tsx`)
- **Expand button does NOT work** - clicking it doesn't expand the row
- Expanded content is rendered outside the table structure, causing layout issues
- Request column is missing from the table
- Response shows truncated content in table cell, but expand functionality is broken

### Target State
- Fix expand button functionality - rows should actually expand/collapse
- Add request column to table showing truncated request
- Table cells show truncated request + response (ellipsis)
- Expanded section shows full request + response as sent/received from OpenAI when row is expanded
- Expanded content should be properly integrated into table structure

### Implementation Steps

#### 2.1 Fix Expand Functionality

**Root Cause**: Expanded content is rendered outside the `<table>` element, after it closes. This breaks the table structure and the expand doesn't work visually.

**Changes to `AiRequestLogTable.tsx`**:
- Move expanded content INSIDE the table structure (as a `<tr>` with `colSpan`)
- Fix the expand button click handler (currently `toggleRow` function exists but expanded content isn't properly connected)
- Add request column (currently missing from table)
- Show truncated request in table cell (similar to response)
- Both request and response should be truncated with ellipsis

**Table Structure**:
```typescript
// Add request column
<th>{t('aiRequestLogs.table.request')}</th>
<td>{truncateText(formatRequest(log.requestJson), 100)}</td>

// Update response column  
<td>{truncateText(formatResponse(log.responseJson), 100)}</td>

// Fix expanded row - render INSIDE tbody as a tr with colSpan
{isExpanded && (
  <tr>
    <td colSpan={10} className="px-4 py-4 bg-background border-t border-border">
      <div className="grid grid-cols-2 gap-4">
        {/* Request and Response content */}
      </div>
    </td>
  </tr>
)}
```

#### 2.2 Improve Expand Display

**Changes**:
- Render expanded content as a table row (`<tr>`) inside the `<tbody>`, not outside the table
- Show full request JSON when expanded (as sent to OpenAI)
- Show full response JSON when expanded (as received from OpenAI)
- Better formatting with proper JSON formatting
- Use code blocks or pre-formatted text

**Expanded Section (Fixed)**:
```typescript
// Inside the logs.map() in tbody, after the main row:
{isExpanded && (
  <tr key={`expanded-${log.id}`}>
    <td colSpan={10} className="px-4 py-4 bg-background border-t border-border">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-text-secondary mb-2">
            {t('aiRequestLogs.request')}
          </h4>
          <pre className="bg-background-tertiary p-3 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(log.requestJson, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="font-medium text-text-secondary mb-2">
            {t('aiRequestLogs.response')}
          </h4>
          <pre className="bg-background-tertiary p-3 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(log.responseJson, null, 2)}
          </pre>
        </div>
      </div>
    </td>
  </tr>
)}
```

**Remove** the expanded content section that's currently rendered outside the table (lines 220-249).

#### 2.3 Helper Functions

**Add utility functions**:
```typescript
const formatRequest = (requestJson: Record<string, unknown>): string => {
  // Extract key information from request (messages, model, etc.)
  // Return formatted string for display
};

const formatResponse = (responseJson: Record<string, unknown>): string => {
  // Extract response content
  // Return formatted string for display
};
```

---

## 3. Table Component in UI Package

### Current State
- Multiple custom table implementations:
  - `UserList` - custom table markup
  - `AgentList` - card-based layout (not a table)
  - `AiRequestLogTable` - custom table with expand functionality
  - `AgentArchetypeList` - card-based layout (not a table)
- No reusable table component
- Inconsistent styling and behavior

### Target State
- Create `Table` component in `packages/ui/src/components/layout/Table/`
- Use TanStack Table (React Table) library
- Support sorting, pagination, expandable rows, actions
- Consistent styling using semantic color classes

### Implementation Steps

#### 3.1 Install TanStack Table

**Package**: `packages/ui/package.json`
```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.x.x"
  }
}
```

#### 3.2 Create Table Component

**Location**: `packages/ui/src/components/layout/Table/Table.tsx`

**Props Interface**:
```typescript
interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  };
  expandable?: {
    renderExpanded: (row: T) => React.ReactNode;
  };
  loading?: boolean;
  emptyMessage?: string;
}
```

**Features**:
- Generic type support for any data type
- Column definitions using TanStack Table
- Built-in sorting, pagination, expandable rows
- Semantic color classes for styling
- Responsive design
- Loading and empty states

#### 3.3 Create Table Sub-components

**Components**:
- `TableHeader` - Header row with sort indicators
- `TableRow` - Individual row component
- `TableCell` - Cell component
- `TablePagination` - Pagination controls
- `TableExpandButton` - Expand/collapse button

#### 3.4 Export from UI Package

**File**: `packages/ui/src/components/layout/index.ts`
```typescript
export * from './Table';
```

**File**: `packages/ui/src/index.ts`
```typescript
export * from './components/layout';
```

#### 3.5 Refactor Admin Tables

**3.5.1 UserList**
- Replace custom table with `Table` component
- Define columns using TanStack Table column definitions
- Use `Table` for consistent styling and behavior

**3.5.2 AgentList**
- Convert from card layout to table layout
- Use `Table` component
- Define columns: Name, Type, Language, Messages, Tokens, Actions

**3.5.3 AiRequestLogTable**
- Refactor to use `Table` component
- Use expandable rows feature
- Define columns with sorting support

**3.5.4 AgentArchetypeList**
- Convert from card layout to table layout
- Use `Table` component
- Define columns: Name, Description, Type, Language, Actions

---

## 4. Tabbed Panel Component

### Current State
- `SystemBehaviorRules` component has custom tab implementation
- `AdminNavigation` has similar tab-like styling
- No reusable tab component in UI package

### Target State
- Create `Tabs` component in `packages/ui/src/components/layout/Tabs/`
- Match styling of `AdminNavigation` (border-bottom active indicator)
- Use for `SystemBehaviorRules` component
- Reusable for any tabbed interface

### Implementation Steps

#### 4.1 Create Tabs Component

**Location**: `packages/ui/src/components/layout/Tabs/Tabs.tsx`

**Props Interface**:
```typescript
interface TabsProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
}
```

**Styling**:
- Match `AdminNavigation` styling:
  - `bg-background-secondary`
  - `border-b border-border`
  - Active: `text-primary border-b-2 border-primary`
  - Inactive: `text-text-tertiary hover:text-text-secondary`

#### 4.2 Create Tab Components

**Components**:
- `Tabs` - Container component
- `TabList` - Tab button container
- `Tab` - Individual tab button
- `TabPanel` - Content panel for each tab

#### 4.3 Export from UI Package

**File**: `packages/ui/src/components/layout/index.ts`
```typescript
export * from './Tabs';
```

#### 4.4 Refactor SystemBehaviorRules

**Changes to `SystemBehaviorRules.tsx`**:
- Replace custom tab implementation with `Tabs` component
- Use `Tab` and `TabPanel` components
- Maintain existing functionality

**Before**:
```typescript
<div className="border-b border-border">
  <div className="flex gap-1">
    {tabs.map((tab) => (
      <button onClick={() => setActiveTab(tab.id)}>
        {tab.label}
      </button>
    ))}
  </div>
</div>
```

**After**:
```typescript
<Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
  <TabPanel id={AgentType.GENERAL} activeTab={activeTab}>
    {renderForm(AgentType.GENERAL)}
  </TabPanel>
  <TabPanel id={AgentType.LANGUAGE_ASSISTANT} activeTab={activeTab}>
    {renderForm(AgentType.LANGUAGE_ASSISTANT)}
  </TabPanel>
</Tabs>
```

---

## 5. Detail-Edit Navigation Flow

### Current State
- `AgentEditPage` - Back button goes to `AGENT_DETAIL`, requires another click to go to list
- `AgentDetailPage` - Back button goes to `AGENTS` list (correct)
- `UserEditPage` - Back button goes to `USER_DETAIL`, requires another click to go to list
- `UserDetailPage` - Back button goes to `USERS` list (correct)

### Target State
- All edit pages should have back button that goes directly to list/table
- All detail pages should have back button that goes directly to list/table
- Consistent navigation pattern across all pages

### Implementation Steps

#### 5.1 Update AgentEditPage

**File**: `apps/admin/src/pages/AgentEditPage.tsx`

**Current**:
```typescript
const handleCancel = () => {
  if (agentId) {
    navigate(ROUTES.AGENT_DETAIL(agentId)); // Goes to detail
  } else {
    navigate(ROUTES.AGENTS);
  }
};
```

**Change to**:
```typescript
const handleCancel = () => {
  navigate(ROUTES.AGENTS); // Always go to list
};
```

**Also update**:
```typescript
// After successful update, go to list instead of detail
// Also update query keys to use queryKeys enum
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.agent.detail(agentId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.agent.list() });
  navigate(ROUTES.AGENTS); // Changed from AGENT_DETAIL
},
```

**Add to query-keys.ts**:
```typescript
agent: {
  all: [QueryKey.AGENT] as const,
  lists: () => [...queryKeys.agent.all, QueryKey.AGENTS] as const,
  list: () => [...queryKeys.agent.lists(), QueryKey.ALL] as const,
  detail: (id: number) => [...queryKeys.agent.all, id] as const,
  memories: (id: number) => [...queryKeys.agent.detail(id), QueryKey.MEMORIES] as const,
},
```

#### 5.2 Update UserEditPage

**File**: `apps/admin/src/pages/UserEditPage.tsx`

**Current**:
```typescript
onClick={() => navigate(ROUTES.USER_DETAIL(id!))} // Goes to detail
```

**Change to**:
```typescript
onClick={() => navigate(ROUTES.USERS)} // Go to list
```

**Also update**:
```typescript
// After successful update, go to list instead of detail
// Also update query keys to use queryKeys enum
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.user.detail(id!) });
  queryClient.invalidateQueries({ queryKey: queryKeys.user.list() });
  navigate(ROUTES.USERS); // Changed from USER_DETAIL
},
```

**Add to query-keys.ts**:
```typescript
user: {
  all: [QueryKey.USER] as const,
  me: () => [...queryKeys.user.all, QueryKey.ME] as const,
  lists: () => [...queryKeys.user.all, QueryKey.USERS] as const,
  list: () => [...queryKeys.user.lists(), QueryKey.ALL] as const,
  detail: (id: string) => [...queryKeys.user.all, id] as const,
},
```

**Update all query key usages**:
- Replace `['user', id]` with `queryKeys.user.detail(id)`
- Replace `['users']` with `queryKeys.user.list()`
- Replace `['admin-agent', agentId]` with `queryKeys.agent.detail(agentId)`
- Replace `['admin-agents']` with `queryKeys.agent.list()`
- Replace `['admin-agent-memories', agentId]` with `queryKeys.agent.memories(agentId)`
- Replace `['agent-archetypes']` with `queryKeys.archetype.list()` (add archetype to queryKeys)

#### 5.3 Verify Detail Pages

**AgentDetailPage** - Already correct (goes to `ROUTES.AGENTS`)
**UserDetailPage** - Already correct (goes to `ROUTES.USERS`)

---

## 6. User Detail/Edit Layout Fix

### Current State
- `UserDetailPage` uses `Container`, `PageHeader`, `PageContent` from `@openai/ui`
- `UserEditPage` uses `Container`, `PageHeader`, `PageContent` from `@openai/ui`
- `AgentDetailPage` does NOT use layout components (uses custom divs)
- **User pages layout is broken** - the `Container`/`PageHeader`/`PageContent` structure is causing issues
- `Layout` component already provides `<main className="p-8">` wrapper, so additional containers may be adding conflicting padding

### Target State
- All detail/edit pages use consistent layout pattern
- Fix broken layout in user pages
- Match the working pattern from `AgentDetailPage` (simple divs, no Container/PageHeader/PageContent)

### Implementation Steps

#### 6.1 Fix UserDetailPage Layout

**Issue**: `Container`, `PageHeader`, and `PageContent` components are not working correctly in the admin app context. The `Layout` component already provides padding via `<main className="p-8">`, so additional containers may conflict.

**Solution**: Match the structure used in `AgentDetailPage` (which works correctly)

**Change UserDetailPage from**:
```typescript
<Container>
  <PageHeader ... />
  <PageContent>
    <div className="space-y-6">
      <Card ... />
    </div>
  </PageContent>
</Container>
```

**To** (matching AgentDetailPage pattern):
```typescript
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Button variant="icon" size="sm" onClick={() => navigate(ROUTES.USERS)}>
        <IconArrowLeft className="w-5 h-5" />
      </Button>
      <h2 className="text-xl font-semibold text-text-secondary">
        {user.firstName || user.lastName ? ... : user.email || user.id}
      </h2>
    </div>
    <div className="flex gap-2">
      {/* Edit and Delete buttons */}
    </div>
  </div>
  
  <Card padding="md" variant="outlined">
    {/* Content */}
  </Card>
</div>
```

#### 6.2 Fix UserEditPage Layout

**Apply same fix** - remove `Container`/`PageHeader`/`PageContent` and use simple div structure matching `AgentEditPage`:

```typescript
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Button variant="icon" size="sm" onClick={() => navigate(ROUTES.USERS)}>
        <IconArrowLeft className="w-5 h-5" />
      </Button>
      <h2 className="text-xl font-semibold text-text-secondary">
        {t('users.edit.title')}
      </h2>
    </div>
  </div>
  
  <form onSubmit={handleSubmit} className="space-y-6">
    <Card padding="md" variant="outlined">
      {/* Form fields */}
    </Card>
  </form>
</div>
```

#### 6.3 Note on Layout Components

**Why not use Container/PageHeader/PageContent?**
- The admin app's `Layout` component already provides the main wrapper with padding
- These layout components may be designed for client app structure, not admin app
- The simple div structure works correctly and is consistent with `AgentDetailPage` and `AgentEditPage`

---

## 7. Implementation Order

### Phase 1: Foundation (Week 1)
1. Create `Tabs` component in UI package
2. Create `Table` component in UI package
3. Fix user detail/edit layout issues

### Phase 2: Forms (Week 2)
4. Create shared `AgentForm` component
5. Refactor `AgentArchetypeForm` to use `AgentForm`
6. Refactor `AgentEditPage` to use `AgentForm` with all fields

### Phase 3: Tables (Week 3)
7. Refactor `UserList` to use `Table` component
8. Refactor `AgentList` to use `Table` component
9. Refactor `AiRequestLogTable` to use `Table` component
10. Refactor `AgentArchetypeList` to use `Table` component

### Phase 4: Navigation & Polish (Week 4)
11. Fix AI logs expand functionality
12. Fix detail-edit navigation flows
13. Update `SystemBehaviorRules` to use `Tabs` component
14. Update `AgentDetailPage` to use layout components

---

## 8. Testing Checklist

### Component Tests
- [ ] `AgentForm` - Test both archetype and agent modes
- [ ] `AgentForm` - Test all field validations
- [ ] `Table` - Test sorting, pagination, expandable rows
- [ ] `Tabs` - Test tab switching and active states

### Integration Tests
- [ ] Agent archetype creation flow
- [ ] Agent editing flow with all fields
- [ ] User detail/edit navigation
- [ ] Agent detail/edit navigation
- [ ] AI logs expand/collapse
- [ ] System rules tab switching

### Visual Tests
- [ ] All tables render correctly
- [ ] Layout components work consistently
- [ ] Tabs match admin navigation style
- [ ] Forms display all fields correctly

---

## 9. Files to Create/Modify

### New Files
- `packages/ui/src/components/layout/Table/Table.tsx`
- `packages/ui/src/components/layout/Table/TableHeader.tsx`
- `packages/ui/src/components/layout/Table/TableRow.tsx`
- `packages/ui/src/components/layout/Table/TableCell.tsx`
- `packages/ui/src/components/layout/Table/TablePagination.tsx`
- `packages/ui/src/components/layout/Table/index.ts`
- `packages/ui/src/components/layout/Tabs/Tabs.tsx`
- `packages/ui/src/components/layout/Tabs/TabList.tsx`
- `packages/ui/src/components/layout/Tabs/Tab.tsx`
- `packages/ui/src/components/layout/Tabs/TabPanel.tsx`
- `packages/ui/src/components/layout/Tabs/index.ts`
- `apps/admin/src/components/AgentForm.tsx`
- `apps/admin/src/types/agent-form.types.ts` (with `AgentFormMode` enum)
- `apps/admin/src/utils/agent-form-validation.ts`

### Modified Files
- `packages/ui/src/components/layout/index.ts`
- `packages/ui/src/index.ts`
- `packages/ui/package.json`
- `apps/admin/src/components/AgentArchetypeForm.tsx`
- `apps/admin/src/pages/AgentEditPage.tsx`
- `apps/admin/src/pages/AgentDetailPage.tsx`
- `apps/admin/src/pages/UserDetailPage.tsx` (fix layout - remove Container/PageHeader/PageContent)
- `apps/admin/src/pages/UserEditPage.tsx` (fix layout - remove Container/PageHeader/PageContent)
- `apps/admin/src/components/AiRequestLogTable.tsx` (fix expand functionality)
- `apps/admin/src/components/UserList.tsx`
- `apps/admin/src/components/AgentList.tsx`
- `apps/admin/src/components/AgentArchetypeList.tsx`
- `apps/admin/src/components/SystemBehaviorRules.tsx`
- `apps/admin/src/hooks/queries/query-keys.ts` (add agent and archetype query keys)
- `apps/admin/src/pages/AgentsPage.tsx` (update query keys)
- `apps/admin/src/pages/AgentArchetypesPage.tsx` (update query keys)
- `apps/admin/src/components/AgentMemoriesList.tsx` (update query keys)

---

## 10. Dependencies

### New Dependencies
- `@tanstack/react-table` - Add to `packages/ui/package.json`

### No Breaking Changes
- All changes are internal refactorings
- API contracts remain the same
- No database migrations needed

---

## 11. Success Criteria

1. ✅ Agent archetype form allows full creation with all model fields
2. ✅ Agent edit form allows full editing with all model fields
3. ✅ Forms are shared between archetype and agent editing
4. ✅ AI logs table shows truncated request/response with expand functionality
5. ✅ Reusable `Table` component exists in UI package
6. ✅ All admin tables use the new `Table` component
7. ✅ Reusable `Tabs` component exists in UI package
8. ✅ `SystemBehaviorRules` uses `Tabs` component
9. ✅ All detail/edit pages navigate directly to list on back button
10. ✅ User detail/edit layout is fixed and consistent with agent pages

---

## Notes

- All new components must use semantic color classes (no hardcoded Tailwind colors)
- All user-facing strings must use translation keys
- Follow the coding guide for component structure and organization
- Run `pnpm typecheck` and `pnpm lint` after each phase
- Add tests for new components and refactored functionality
