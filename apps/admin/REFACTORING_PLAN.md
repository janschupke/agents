# Admin App Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan for the admin app, focusing on:
- Replacing custom markup with existing UI components from `@openai/ui` where appropriate (ConfirmModal, Toast, Skeleton)
- Creating admin-specific components for layout/structure (NOT using client-specific UI components)
- Centralizing duplicated markup to admin components folder
- Splitting large components into smaller, manageable parts
- Extracting business logic from components into hooks
- Removing duplicate code

**Important Notes**:
- **DO NOT use** `PageContainer`, `Container`, or `PageHeader` from `@openai/ui` - these are client-specific
- **DO use** `ConfirmModal`, `Toast`, and `Skeleton` from `@openai/ui`
- Create admin-specific layout components instead of using client components

## Analysis Summary

### Component Size Issues
- **SystemBehaviorRules.tsx**: 351 lines - needs splitting
- **AgentForm.tsx**: 730 lines - needs significant refactoring
- **AgentDetailPage.tsx**: 324 lines - can be split into sections
- **AiRequestLogTable.tsx**: 303 lines - formatting logic should be extracted

### Business Logic in Components
- Form validation logic in `AgentForm.tsx`
- Data transformation/mapping in multiple components
- State management that should be in hooks
- Delete confirmation logic duplicated across pages

### Duplicated Markup
- Error message displays (red boxes) across 8+ pages
- Loading states duplicated
- Page headers with back buttons duplicated
- Delete confirmation dialogs duplicated (UsersPage, UserDetailPage)
- Form sections duplicated in AgentForm

### Custom Markup That Should Use UI Components
- Custom delete confirmation dialogs → Use `ConfirmModal` from `@openai/ui`
- Custom error/success messages → Use `Toast` from `@openai/ui`
- Custom loading states → Use `Skeleton` from `@openai/ui`
- Custom page headers → Extract to admin-specific `AdminPageHeader` component
- Custom containers → Extract to admin-specific layout components (NOT client's PageContainer/Container)
- Custom navigation → Extract nav item to `AdminNavItem` component (keep current layout)
- Custom navigation tabs (already using `Tabs`, but can improve)

---

## Phase 1: Centralize Common Components

### 1.1 Create Shared Components Directory Structure

```
apps/admin/src/components/
├── shared/
│   ├── AdminPageHeader.tsx              # Admin-specific page header (title + description)
│   ├── PageHeaderWithBack.tsx           # Page header with back button
│   ├── LoadingState.tsx                 # Centralized loading display
│   └── index.ts                         # Export all shared components
├── layout/
│   ├── AdminPageContainer.tsx           # Admin-specific page container (if needed)
│   ├── AdminAuthContainer.tsx           # Container for auth states
│   ├── AdminNavItem.tsx                 # Reusable navigation item
│   └── ...
```

**Note**: 
- Use `ConfirmModal` from `@openai/ui` instead of creating DeleteConfirmDialog
- Use `Toast` from `@openai/ui` for error/success messages instead of ErrorMessage component

### 1.2 DeleteConfirmDialog Component

**Current Issue**: Delete confirmation dialog is duplicated in:
- `UsersPage.tsx` (lines 78-109)
- `UserDetailPage.tsx` (lines 181-206)

**Solution**: Use `ConfirmModal` from `@openai/ui` package

**Refactor Targets**:
- `apps/admin/src/pages/UsersPage.tsx` - Replace lines 78-109 with `ConfirmModal`
- `apps/admin/src/pages/UserDetailPage.tsx` - Replace lines 181-206 with `ConfirmModal`
- Import: `import { ConfirmModal } from '@openai/ui'`

### 1.3 Error and Success Messages

**Current Issue**: Error message markup duplicated across:
- `UsersPage.tsx` (lines 59-65)
- `UserDetailPage.tsx` (lines 65-73)
- `UserEditPage.tsx` (lines 81-89)
- `AgentsPage.tsx` (lines 48-56)
- `AgentDetailPage.tsx` (lines 69-75)
- `AgentEditPage.tsx` (lines 147-153)
- `AgentArchetypesPage.tsx` (lines 56-64)
- `AiRequestLogsPage.tsx` (lines 36-42)
- `SystemBehaviorRules.tsx` (lines 233-243) - success message

**Solution**: Use `Toast` component from `@openai/ui` package for both error and success messages

**Note**: May need to create a toast context/provider in admin app to manage toast state, or use a simpler state management approach.

**Refactor Targets**: All pages listed above - replace error message divs with Toast notifications

### 1.4 LoadingState Component

**Current Issue**: Loading states duplicated across:
- `UsersPage.tsx` (lines 51-57)
- `UserDetailPage.tsx` (lines 56-63)
- `UserEditPage.tsx` (lines 72-79)
- `AgentDetailPage.tsx` (lines 61-67)
- `AgentEditPage.tsx` (lines 139-145)
- `AiRequestLogsPage.tsx` (lines 28-34)
- `SystemBehaviorRules.tsx` (lines 213-219)

**Solution**: Create `components/shared/LoadingState.tsx`

```typescript
interface LoadingStateProps {
  message?: string;
  className?: string;
}
```

**Refactor Targets**: All pages/components listed above

### 1.5 PageHeaderWithBack Component

**Current Issue**: Page header with back button duplicated in:
- `UserDetailPage.tsx` (lines 77-92)
- `UserEditPage.tsx` (lines 93-106)
- `AgentDetailPage.tsx` (lines 79-92)
- `AgentEditPage.tsx` (lines 157-170)

**Solution**: Create `components/shared/PageHeaderWithBack.tsx`

```typescript
interface PageHeaderWithBackProps {
  title: string;
  backPath: string;
  actions?: ReactNode;
}
```

**Refactor Targets**: All detail/edit pages listed above

---

## Phase 2: Replace Custom Markup with UI Components

### 2.1 Extract Admin-Specific Layout Components

**Current Issue**: Custom layout markup in:
- `Layout.tsx` (lines 14-18) - uses custom divs
- `App.tsx` (lines 39-42, 47-59, 65-68, 77-92) - custom loading/error states

**Solution**: **DO NOT use `PageContainer`/`Container` from `@openai/ui`** - these are for client app and will break admin layout. Instead, extract admin-specific layout components:

- Create `components/layout/AdminPageContainer.tsx` - Admin-specific page container
- Create `components/layout/AdminAuthContainer.tsx` - Container for auth states (sign in, loading, error)

**Refactor Targets**:
- `apps/admin/src/components/Layout.tsx` - Keep current structure, but extract to `AdminPageContainer` if needed
- `apps/admin/src/App.tsx` - Extract auth state containers to `AdminAuthContainer`

### 2.2 Extract Admin-Specific Page Header Component

**Current Issue**: Custom page headers in:
- `UsersPage.tsx` (lines 69-76)
- `AgentsPage.tsx` (lines 60-67)
- `AgentArchetypesPage.tsx` (lines 68-77)
- `AiRequestLogsPage.tsx` (lines 46-55)

**Solution**: **DO NOT use `PageHeader` from `@openai/ui`** - it's for client app and will break admin pages. Instead, create admin-specific page header component:

- Create `components/shared/AdminPageHeader.tsx` - Admin-specific page header with title and description

**Refactor Targets**: All pages listed above - replace with `AdminPageHeader` component

### 2.3 Replace Custom Error Messages with Toast

**Current Issue**: Custom error message markup (red boxes) across all pages

**Solution**: 
- Use `Toast` component from `@openai/ui` (see Phase 1.3)
- Replace all error message divs with Toast notifications

**Refactor Targets**: All pages with error handling

### 2.4 Replace Custom Loading States with Skeleton

**Current Issue**: Custom loading text/spinners instead of `Skeleton` component

**Solution**: Use `Skeleton` from `@openai/ui` for structured loading states

**Refactor Targets**: 
- `UserDetailPage.tsx` (lines 56-63)
- `UserEditPage.tsx` (lines 72-79)
- `AgentMemoriesList.tsx` (lines 85-96) - already uses custom skeleton, replace with `Skeleton`

### 2.5 Replace Custom Select Dropdowns with UI Package Select

**Current Issue**: Custom `<select>` elements in:
- `AgentForm.tsx` (lines 319-338, 503-530, 558-579, 586-606, 615-641, 650-672)
- `UserEditPage.tsx` (lines 189-203) - role toggle buttons

**Solution**: 
- **Create `Select` component in `@openai/ui` package** (not in admin app)
- Replace all custom `<select>` elements in admin app with the new `Select` component from `@openai/ui`
- This component should also be used in client app

**Implementation Steps**:
1. Create `packages/ui/src/components/form/Select/Select.tsx`
2. Export from `packages/ui/src/components/form/index.ts`
3. Replace all `<select>` elements in admin app
4. Use in client app as well

**Refactor Targets**: 
- `apps/admin/src/components/AgentForm.tsx` - Replace all select elements
- `apps/admin/src/pages/UserEditPage.tsx` - Replace role toggle (may need different component for multi-select)

### 2.6 Extract Admin Navigation Markup

**Current Issue**: `AdminNavigation.tsx` uses custom Link styling with duplicated className logic

**Solution**: 
- **DO NOT use `Sidebar`/`SidebarItem` from `@openai/ui`** - keep current admin navigation layout
- Extract navigation item markup to reusable component: `components/layout/AdminNavItem.tsx`
- Ensure it uses semantic color classes (already does)
- Keep current navigation structure but reduce duplication

**Refactor Targets**: `apps/admin/src/components/layout/AdminNavigation.tsx` - extract nav item to `AdminNavItem` component

---

## Phase 3: Extract Business Logic to Hooks

### 3.1 Extract Form Validation Logic

**Current Issue**: Validation logic in `AgentForm.tsx` (lines 103-138)

**Solution**: Create `hooks/use-agent-form-validation.ts`

```typescript
export function useAgentFormValidation(
  formValues: FormValues,
  isArchetype: boolean
) {
  const validate = (): Record<string, string> => {
    // Validation logic
  };
  
  return { validate, errors };
}
```

**Refactor Targets**: `apps/admin/src/components/AgentForm.tsx`

### 3.2 Extract Data Transformation Logic

**Current Issue**: Data mapping logic duplicated in:
- `AgentArchetypeForm.tsx` (lines 52-82, 84-134)
- `AgentEditPage.tsx` (lines 49-73, 75-122)

**Solution**: Create `hooks/use-agent-form-mapping.ts`

```typescript
export function useAgentFormMapping() {
  const mapToFormData = (agent: Agent | AgentArchetype): AgentFormData;
  const mapToRequest = (data: AgentFormData, isArchetype: boolean): RequestData;
  
  return { mapToFormData, mapToRequest };
}
```

**Refactor Targets**:
- `apps/admin/src/components/AgentArchetypeForm.tsx`
- `apps/admin/src/pages/AgentEditPage.tsx`

### 3.3 Extract Delete Mutation Logic

**Current Issue**: Delete mutation logic duplicated across pages

**Solution**: Create hooks for each entity:
- `hooks/use-delete-user.ts`
- `hooks/use-delete-agent.ts`
- `hooks/use-delete-archetype.ts`

**Refactor Targets**:
- `apps/admin/src/pages/UsersPage.tsx`
- `apps/admin/src/pages/UserDetailPage.tsx`
- `apps/admin/src/pages/AgentsPage.tsx`
- `apps/admin/src/pages/AgentDetailPage.tsx`
- `apps/admin/src/pages/AgentArchetypesPage.tsx`

### 3.4 Extract System Rules Form Logic

**Current Issue**: Complex form state management in `SystemBehaviorRules.tsx`

**Solution**: Create `hooks/use-system-rules-form.ts`

```typescript
export function useSystemRulesForm(agentType: AgentType) {
  // Form state management
  // Tab switching logic
  // Save logic
  // Error handling
}
```

**Refactor Targets**: `apps/admin/src/components/SystemBehaviorRules.tsx`

### 3.5 Extract Formatting Utilities

**Current Issue**: Formatting functions in `AiRequestLogTable.tsx` (lines 39-76)

**Solution**: Create `utils/format-ai-request-log.ts`

```typescript
export function formatDate(dateString: string): string;
export function formatPrice(price: number | string | null | undefined): string;
export function truncateText(text: string, maxLength: number): string;
export function formatRequest(requestJson: Record<string, unknown>): string;
export function formatResponse(responseJson: Record<string, unknown>): string;
```

**Refactor Targets**: `apps/admin/src/components/AiRequestLogTable.tsx`

---

## Phase 4: Split Large Components

### 4.1 Split AgentForm Component

**Current Issue**: `AgentForm.tsx` is 730 lines - too large

**Solution**: Split into smaller components:

```
components/agent-form/
├── AgentForm.tsx                    # Main form container
├── BasicInfoSection.tsx            # Basic info fields
├── ConfigurationSection.tsx        # Configuration fields
├── PersonalitySection.tsx          # Personality & behavior fields
├── BehaviorRulesSection.tsx        # Behavior rules (archetype only)
└── index.ts
```

**Refactor Plan**:
- Extract Basic Info section (lines 254-357) → `BasicInfoSection.tsx`
- Extract Configuration section (lines 359-486) → `ConfigurationSection.tsx`
- Extract Personality section (lines 488-698) → `PersonalitySection.tsx`
- Extract Behavior Rules section (lines 437-485) → `BehaviorRulesSection.tsx`
- Keep form logic and validation in main `AgentForm.tsx`

### 4.2 Split SystemBehaviorRules Component

**Current Issue**: `SystemBehaviorRules.tsx` is 351 lines with complex logic

**Solution**: Split into:
- `SystemRulesForm.tsx` - Form for a single agent type
- `SystemRulesTabPanel.tsx` - Tab panel content
- Keep main component for tab management

**Refactor Plan**:
- Extract form rendering (lines 226-323) → `SystemRulesForm.tsx`
- Extract tab panel (lines 341-347) → `SystemRulesTabPanel.tsx`
- Keep tab state and data loading in main component

### 4.3 Split AgentDetailPage Component

**Current Issue**: `AgentDetailPage.tsx` is 324 lines with multiple sections

**Solution**: Split into section components:

```
components/agent-detail/
├── AgentBasicInfo.tsx              # Basic information card
├── AgentConfiguration.tsx          # Configuration card
├── AgentDemographics.tsx            # Demographics card
└── index.ts
```

**Refactor Plan**:
- Extract Basic Info card (lines 112-172) → `AgentBasicInfo.tsx`
- Extract Configuration card (lines 174-228) → `AgentConfiguration.tsx`
- Extract Demographics card (lines 230-306) → `AgentDemographics.tsx`
- Keep page structure and data fetching in main component

### 4.4 Split AiRequestLogTable Component

**Current Issue**: `AiRequestLogTable.tsx` is 303 lines with formatting logic

**Solution**: 
- Extract formatting utilities (Phase 3.5)
- Extract column definitions to separate file or hook
- Keep table component focused on rendering

**Refactor Plan**:
- Move formatting functions to `utils/format-ai-request-log.ts` (Phase 3.5)
- Extract column definitions to `hooks/use-ai-request-log-columns.ts`
- Simplify main component to just table rendering

---

## Phase 5: Remove Duplicate Code

### 5.1 Consolidate Error Handling

**Current Issue**: Error message extraction logic duplicated in:
- `App.tsx` (lines 27-35)
- `UsersPage.tsx` (lines 44-49)
- Multiple other pages

**Solution**: Create `utils/extract-error-message.ts`

```typescript
export function extractErrorMessage(
  error: unknown,
  defaultMessage: string
): string;
```

**Refactor Targets**: All pages with error handling

### 5.2 Consolidate Loading States

**Current Issue**: Loading state checks duplicated across pages

**Solution**: Use `LoadingState` component (Phase 1.4)

**Refactor Targets**: All pages with loading states

### 5.3 Consolidate Form Sections

**Current Issue**: Similar form section patterns in `AgentForm.tsx`

**Solution**: Create reusable form section component

```typescript
interface FormSectionProps {
  title: string;
  children: ReactNode;
}
```

**Refactor Targets**: `apps/admin/src/components/AgentForm.tsx` (after splitting)

### 5.4 Consolidate Card Display Patterns

**Current Issue**: Similar card display patterns in detail pages

**Solution**: Create reusable `DetailCard` component

```typescript
interface DetailCardProps {
  title: string;
  children: ReactNode;
  gridCols?: number;
}
```

**Refactor Targets**: 
- `apps/admin/src/pages/UserDetailPage.tsx`
- `apps/admin/src/pages/AgentDetailPage.tsx`

---

## Phase 6: Improve Component Organization

### 6.1 Reorganize Component Structure

**Current Structure**:
```
components/
├── AgentForm.tsx
├── AgentList.tsx
├── UserList.tsx
└── ...
```

**Proposed Structure**:
```
components/
├── shared/                    # Shared/common components
│   ├── DeleteConfirmDialog.tsx
│   ├── ErrorMessage.tsx
│   ├── LoadingState.tsx
│   └── PageHeaderWithBack.tsx
├── agent/                     # Agent-related components
│   ├── form/
│   │   ├── AgentForm.tsx
│   │   ├── BasicInfoSection.tsx
│   │   └── ...
│   ├── detail/
│   │   ├── AgentBasicInfo.tsx
│   │   └── ...
│   ├── AgentList.tsx
│   └── AgentMemoriesList.tsx
├── user/                      # User-related components
│   └── UserList.tsx
├── system/                    # System-related components
│   ├── SystemBehaviorRules.tsx
│   └── SystemRulesForm.tsx
└── layout/                   # Layout components
    ├── Layout.tsx
    ├── AdminHeader.tsx
    └── AdminNavigation.tsx
```

### 6.2 Create Feature-Based Hooks Structure

**Current Structure**:
```
hooks/
├── queries/
│   ├── use-user.ts
│   └── ...
└── use-token-ready.ts
```

**Proposed Structure**:
```
hooks/
├── queries/                  # React Query hooks
│   ├── use-user.ts
│   └── ...
├── agent/                    # Agent-related hooks
│   ├── use-agent-form-validation.ts
│   ├── use-agent-form-mapping.ts
│   └── use-delete-agent.ts
├── user/                     # User-related hooks
│   └── use-delete-user.ts
└── system/                   # System-related hooks
    └── use-system-rules-form.ts
```

---

## Implementation Priority

### High Priority (Immediate Impact)
1. **Phase 1**: Use ConfirmModal and Toast from UI package, create LoadingState and AdminPageHeader
2. **Phase 2.1-2.2**: Extract admin-specific layout components (AdminPageContainer, AdminAuthContainer, AdminPageHeader)
3. **Phase 2.5**: Create Select component in `@openai/ui` and replace all select dropdowns
4. **Phase 3.5**: Extract formatting utilities from AiRequestLogTable

### Medium Priority (Code Quality)
5. **Phase 3.1-3.4**: Extract business logic to hooks
6. **Phase 4.1**: Split AgentForm component
7. **Phase 5.1-5.2**: Consolidate error handling and loading states

### Low Priority (Polish)
8. **Phase 4.2-4.4**: Split remaining large components
9. **Phase 5.3-5.4**: Consolidate form sections and card patterns
10. **Phase 6**: Reorganize component structure

---

## Testing Strategy

### Unit Tests
- Test all new hooks in isolation
- Test shared components with various props
- Test utility functions

### Integration Tests
- Test form submissions with new hooks
- Test delete confirmations with shared dialog
- Test error handling with shared components

### Visual Regression
- Ensure UI components match existing design
- Verify responsive behavior
- Check accessibility

---

## Migration Checklist

### Before Starting
- [ ] Review all affected files
- [ ] Create feature branch
- [ ] Set up test coverage baseline

### Phase 1: Shared Components
- [ ] Replace delete dialogs with `ConfirmModal` from `@openai/ui`
- [ ] Set up Toast system for error/success messages (use `Toast` from `@openai/ui`)
- [ ] Create `LoadingState` component
- [ ] Create `AdminPageHeader` component
- [ ] Create `PageHeaderWithBack` component
- [ ] Replace duplicates in all pages
- [ ] Test all replacements

### Phase 2: Admin-Specific Components & UI Components
- [ ] Extract admin-specific layout components (AdminPageContainer, AdminAuthContainer)
- [ ] Replace page headers with AdminPageHeader
- [ ] Replace error messages with Toast
- [ ] Replace loading states with Skeleton
- [ ] Extract AdminNavItem component
- [ ] Create Select component in `@openai/ui` package
- [ ] Replace all select dropdowns with Select component
- [ ] Test all replacements

### Phase 3: Extract Logic
- [ ] Extract form validation logic
- [ ] Extract data transformation logic
- [ ] Extract delete mutation logic
- [ ] Extract system rules form logic
- [ ] Extract formatting utilities
- [ ] Test all hooks

### Phase 4: Split Components
- [ ] Split AgentForm
- [ ] Split SystemBehaviorRules
- [ ] Split AgentDetailPage
- [ ] Split AiRequestLogTable
- [ ] Test all splits

### Phase 5: Remove Duplicates
- [ ] Consolidate error handling
- [ ] Consolidate loading states
- [ ] Consolidate form sections
- [ ] Consolidate card patterns
- [ ] Test all consolidations

### Phase 6: Reorganize
- [ ] Reorganize component structure
- [ ] Reorganize hooks structure
- [ ] Update imports
- [ ] Test all imports

### Final Steps
- [ ] Run full test suite
- [ ] Run linter and fix issues
- [ ] Run type checker
- [ ] Review code with team
- [ ] Merge to main

---

## Notes

### Breaking Changes
- None expected - all changes are internal refactoring

### Dependencies
- `@openai/ui` package already has:
  - `ConfirmModal` - for delete confirmations
  - `Toast` - for error/success messages
  - `Skeleton` - for loading states
- **Need to create**:
  - `Select` component in `@openai/ui` package (for use in both admin and client apps)
- May need to create toast context/provider in admin app for managing toast state
- **DO NOT use client-specific components**: PageContainer, Container, PageHeader from UI package

### Performance Considerations
- Splitting components may improve code splitting
- Extracting hooks may improve re-render performance
- No expected performance regressions

### Accessibility
- Ensure all UI components maintain accessibility
- Test keyboard navigation
- Test screen reader compatibility

---

## Estimated Effort

- **Phase 1**: 2-3 days
- **Phase 2**: 2-3 days
- **Phase 3**: 3-4 days
- **Phase 4**: 4-5 days
- **Phase 5**: 2-3 days
- **Phase 6**: 1-2 days

**Total**: 14-20 days

---

## Success Criteria

1. ✅ All duplicate code removed or centralized
2. ✅ All large components (>500 lines) split
3. ✅ All business logic extracted to hooks
4. ✅ All custom markup replaced with UI components
5. ✅ All tests passing
6. ✅ No linting errors
7. ✅ No type errors
8. ✅ Code coverage maintained or improved
9. ✅ Visual design unchanged
10. ✅ All functionality working as before
