# Client App UI Refactoring Plan

This document identifies ALL occurrences of structural markup and plain HTML elements that should be refactored to use UI components from `@openai/ui`.

## Summary

- **Total files needing refactoring**: 15
- **Plain button elements**: 12 occurrences
- **Plain input/textarea elements**: 0 (already refactored)
- **Structural components needed**: 8 new components
- **Card-like containers**: 5 occurrences
- **Header patterns**: 3 occurrences
- **List item patterns**: 2 occurrences
- **Avatar/Initial patterns**: 4 occurrences
- **Badge/Tag patterns**: 1 occurrence
- **Dropdown patterns**: 1 occurrence
- **Empty state patterns**: 2 occurrences

---

## 1. Button Elements

### 1.1 SessionItem.tsx
**File**: `apps/client/src/pages/chat/components/session/SessionItem.tsx`

**Issues**:
- 3 plain `<button>` elements with complex className patterns
- Icon buttons should use `Button` component with `ButtonVariant.ICON`

**Lines 38-54**: Main select button
```tsx
<button
  onClick={() => onSelect(session.id)}
  className={`flex-1 px-3 py-2 text-left transition-colors min-w-0 bg-transparent ${
    isSelected ? 'text-text-inverse' : ''
  }`}
>
```
**Action**: Extract to `SidebarItem` component or use Button component

**Lines 57-70**: Edit button
```tsx
<button
  onClick={(e) => { e.stopPropagation(); onEdit(session.id); }}
  className={`px-2 py-1 transition-colors bg-transparent ${
    isSelected
      ? 'text-text-inverse hover:opacity-80'
      : 'text-text-tertiary hover:text-text-primary'
  }`}
>
```
**Action**: Replace with `Button` component using `ButtonVariant.ICON`

**Lines 73-86**: Delete button
```tsx
<button
  onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
  className={`px-2 py-1 transition-colors bg-transparent ${
    isSelected
      ? 'text-text-inverse hover:opacity-100'
      : 'text-text-tertiary hover:text-red-500'
  }`}
>
```
**Action**: Replace with `Button` component using `ButtonVariant.ICON`

---

### 1.2 MessageBubble.tsx
**File**: `apps/client/src/pages/chat/components/chat/MessageBubble.tsx`

**Issues**:
- 2 plain `<button>` elements for action buttons
- Should use `Button` component with `ButtonVariant.ICON`

**Lines 68-93**: Translation button
```tsx
<button
  onClick={handleTranslate}
  disabled={isTranslating || !messageId}
  className="p-1 rounded hover:bg-black hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed"
>
```
**Action**: Replace with `Button` component using `ButtonVariant.ICON`

**Lines 97-121**: JSON view button
```tsx
<button
  onClick={(e) => { e.stopPropagation(); onShowJson(...); }}
  className="p-1 rounded hover:bg-black hover:bg-opacity-10"
>
```
**Action**: Replace with `Button` component using `ButtonVariant.ICON`

---

### 1.3 AgentSelector.tsx
**File**: `apps/client/src/pages/config/components/agent/AgentSelector.tsx`

**Issues**:
- 2 plain `<button>` elements
- Main selector button and dropdown items

**Lines 49-71**: Main selector button
```tsx
<button
  onClick={() => setIsOpen(!isOpen)}
  className="flex items-center gap-3 h-10 px-2 rounded-md hover:bg-background-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
>
```
**Action**: Replace with `Button` component or create `SelectButton` component

**Lines 76-100**: Dropdown item buttons
```tsx
<button
  onClick={() => handleAgentSelect(agent.id)}
  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
    agent.id === selectedAgentId
      ? 'bg-primary text-text-inverse'
      : 'text-text-primary hover:bg-background-tertiary'
  }`}
>
```
**Action**: Create `DropdownItem` component or use Button component

---

### 1.4 MemoriesSection.tsx
**File**: `apps/client/src/pages/config/components/agent/MemoriesSection.tsx`

**Issues**:
- 1 plain `<button>` element for refresh

**Lines 36-45**: Refresh button
```tsx
<button
  onClick={onRefresh}
  disabled={loading}
  className="h-6 w-6 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
```
**Action**: Replace with `Button` component using `ButtonVariant.ICON`

---

### 1.5 AgentSidebar.tsx
**File**: `apps/client/src/pages/config/components/agent/AgentSidebar.tsx`

**Issues**:
- 1 plain `<button>` element for agent selection

**Lines 54-79**: Agent select button
```tsx
<button
  onClick={() => onAgentSelect(agent.id)}
  className="flex-1 px-3 py-2 text-left transition-colors min-w-0 bg-transparent"
>
```
**Action**: Extract to `SidebarItem` component (same pattern as SessionItem)

---

## 2. Structural Components Needed

### 2.1 SidebarItem Component
**Pattern**: Reusable sidebar list item with selection state

**Used in**:
- `SessionItem.tsx` (lines 31-89)
- `AgentSidebar.tsx` (lines 74-96)

**Features needed**:
- Selected/unselected states
- Primary and secondary text
- Action buttons (edit/delete) on hover
- Click handler

**Component API**:
```tsx
<SidebarItem
  isSelected={boolean}
  primaryText={string}
  secondaryText={string}
  onClick={() => void}
  actions?: Array<{
    icon: ReactNode
    onClick: () => void
    variant?: 'default' | 'danger'
    tooltip?: string
  }>
/>
```

---

### 2.2 MessageBubble Component
**Pattern**: Chat message bubble with actions

**Used in**:
- `MessageBubble.tsx` (lines 35-140)

**Features needed**:
- User/assistant variants
- Action buttons overlay
- Translation support
- Card-like container

**Action**: Extract message bubble container to `MessageBubble` component in UI package (or keep in client but use UI components)

---

### 2.3 Avatar Component
**Pattern**: Avatar with fallback to initial

**Used in**:
- `ProfileHeader.tsx` (lines 13-22)
- `AgentSelector.tsx` (lines 54-64, 85-94)
- `AgentSidebar.tsx` (lines 61-62, 92-94)

**Component API**:
```tsx
<Avatar
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
/>
```

**Sizes**:
- `sm`: w-5 h-5 (used in dropdowns)
- `md`: w-10 h-10 (used in selectors)
- `lg`: w-24 h-24 (used in profile)

---

### 2.4 Badge/Tag Component
**Pattern**: Small colored badge for roles/tags

**Used in**:
- `UserDetails.tsx` (lines 54-59)

**Component API**:
```tsx
<Badge variant="primary" | "secondary" | "success" | "warning" | "danger">
  {children}
</Badge>
```

---

### 2.5 SectionHeader Component
**Pattern**: Section header with title and optional action

**Used in**:
- `MemoriesSection.tsx` (lines 31-46)
- `ChatHeader.tsx` (line 5)

**Component API**:
```tsx
<SectionHeader
  title={string}
  action?: {
    icon: ReactNode
    onClick: () => void
    tooltip?: string
  }
/>
```

---

### 2.6 EmptyState Component
**Pattern**: Empty state with icon and message

**Used in**:
- `ChatPlaceholder.tsx` (lines 8-14)
- `ChatEmptyState.tsx` (lines 9-16)

**Component API**:
```tsx
<EmptyState
  icon?: ReactNode
  title?: string
  message?: string
/>
```

---

### 2.7 Dropdown Component
**Pattern**: Dropdown menu with items

**Used in**:
- `AgentSelector.tsx` (lines 73-103)

**Component API**:
```tsx
<Dropdown
  isOpen={boolean}
  trigger={ReactNode}
  items: Array<{
    label: string
    icon?: ReactNode
    onClick: () => void
    isSelected?: boolean
  }>
/>
```

---

### 2.8 InfoField Component
**Pattern**: Label + value display (read-only form field)

**Used in**:
- `UserDetails.tsx` (lines 13-67) - Multiple instances

**Component API**:
```tsx
<InfoField
  label={string}
  value={string | ReactNode}
/>
```

---

## 3. Card-like Containers

### 3.1 MessageBubble.tsx
**Line 128**: Translation bubble
```tsx
<div className="mt-2 px-3 py-2 rounded-lg break-words text-sm bg-background-secondary border border-border text-text-primary">
```
**Action**: Use `Card` component with appropriate variant

---

### 3.2 SessionNameModal.tsx
**Line 105**: Modal header section
```tsx
<div className="flex items-center justify-between px-6 py-4 border-b border-border">
```
**Action**: Use existing `ModalHeader` component from UI package (needs Button refactoring in ModalHeader itself)

---

## 4. Header Patterns

### 4.1 ChatHeader.tsx
**Line 5**: Header container
```tsx
<div className="px-5 py-3 bg-background border-b border-border flex items-center justify-between">
```
**Action**: Create `PageHeader` variant or use existing `PageHeader` component

---

### 4.2 SessionNameModal.tsx
**Line 105**: Modal header
```tsx
<div className="flex items-center justify-between px-6 py-4 border-b border-border">
```
**Action**: Use existing `ModalHeader` component from UI package (also needs to refactor ModalHeader's close button to use Button component)

---

## 5. List Item Patterns

### 5.1 SessionItem.tsx
**Lines 31-89**: Complete item structure
**Action**: Extract to `SidebarItem` component (see 2.1)

---

### 5.2 AgentSidebar.tsx
**Lines 74-96**: Agent item structure
**Action**: Extract to `SidebarItem` component (see 2.1)

---

## 6. Avatar/Initial Patterns

### 6.1 ProfileHeader.tsx
**Lines 13-22**: Avatar with initial fallback
**Action**: Use `Avatar` component (see 2.3)

---

### 6.2 AgentSelector.tsx
**Lines 54-64**: Main selector avatar
**Lines 85-94**: Dropdown item avatars
**Action**: Use `Avatar` component (see 2.3)

---

### 6.3 AgentSidebar.tsx
**Lines 61-62, 92-94**: Agent avatars
**Action**: Use `Avatar` component (see 2.3)

---

## 7. Badge/Tag Patterns

### 7.1 UserDetails.tsx
**Lines 54-59**: Role badges
```tsx
<span className="px-3 py-1 bg-primary text-text-inverse text-xs font-medium rounded-full">
  {role}
</span>
```
**Action**: Use `Badge` component (see 2.4)

---

## 8. Dropdown Patterns

### 8.1 AgentSelector.tsx
**Lines 73-103**: Dropdown menu
**Action**: Extract to `Dropdown` component (see 2.7)

---

## 9. Empty State Patterns

### 9.1 ChatPlaceholder.tsx
**Lines 8-14**: Empty state with icon
**Action**: Use `EmptyState` component (see 2.6)

---

### 9.2 ChatEmptyState.tsx
**Lines 9-16**: Empty state
**Action**: Use `EmptyState` component (see 2.6)

---

## 10. Form/Info Display Patterns

### 10.1 UserDetails.tsx
**Lines 13-67**: Multiple label + value pairs
**Action**: Use `InfoField` component (see 2.8)

---

## 11. BehaviorRulesField.tsx
**File**: `apps/client/src/pages/config/components/agent/AgentConfigFormFields.tsx`

**Issue**: Icon button should use ICON variant
**Line 139**: Remove rule button
```tsx
<Button
  variant={ButtonVariant.SECONDARY}  // Should be ICON
  size="sm"
  className="w-8 p-0"
>
```
**Action**: Change to `ButtonVariant.ICON`

---

## Implementation Priority

### Phase 1: High Priority (Core Components)
1. **Avatar Component** - Used in 3+ files
2. **SidebarItem Component** - Used in 2 files, complex pattern
3. **Button refactoring** - Replace all plain buttons with Button component

### Phase 2: Medium Priority (Structural)
4. **SectionHeader Component** - Used in 2 files
5. **EmptyState Component** - Used in 2 files
6. **Badge Component** - Used in 1 file but reusable
7. **InfoField Component** - Used in 1 file but multiple instances

### Phase 3: Lower Priority (Specialized)
8. **Dropdown Component** - Used in 1 file but complex
9. **MessageBubble container** - Keep in client but use UI components internally

---

## Files Requiring Refactoring

1. ✅ `ChatInput.tsx` - Already refactored
2. ❌ `SessionItem.tsx` - Needs SidebarItem component + Button refactoring
3. ❌ `MessageBubble.tsx` - Needs Button refactoring + Card usage
4. ❌ `AgentSelector.tsx` - Needs Avatar, Dropdown, Button components
5. ❌ `MemoriesSection.tsx` - Needs Button refactoring + SectionHeader
6. ❌ `AgentSidebar.tsx` - Needs SidebarItem component + Avatar
7. ❌ `ProfileHeader.tsx` - Needs Avatar component
8. ❌ `UserDetails.tsx` - Needs InfoField + Badge components
9. ❌ `ChatHeader.tsx` - Needs SectionHeader/PageHeader component
10. ❌ `ChatPlaceholder.tsx` - Needs EmptyState component
11. ❌ `ChatEmptyState.tsx` - Needs EmptyState component
12. ❌ `SessionNameModal.tsx` - Needs ModalHeader component
13. ❌ `AgentConfigFormFields.tsx` - Needs Button variant fix
14. ✅ `ApiKeySection.tsx` - Already refactored
15. ✅ `MemoriesList.tsx` - Already refactored

---

## New UI Components to Create

1. **Avatar** (`packages/ui/src/components/layout/Avatar.tsx`)
2. **SidebarItem** (`packages/ui/src/components/layout/SidebarItem.tsx`)
3. **SectionHeader** (`packages/ui/src/components/layout/SectionHeader.tsx`)
4. **EmptyState** (`packages/ui/src/components/feedback/EmptyState.tsx`)
5. **Badge** (`packages/ui/src/components/layout/Badge.tsx`)
6. **InfoField** (`packages/ui/src/components/form/InfoField.tsx`)
7. **Dropdown** (`packages/ui/src/components/form/Dropdown.tsx`) - Optional, complex

---

## Additional Issues Found

### ModalHeader.tsx (UI Package)
**File**: `packages/ui/src/components/modal/components/ModalHeader.tsx`

**Issue**: Line 15-21 has plain button element
```tsx
<button
  onClick={onClose}
  className="text-text-tertiary hover:text-text-primary transition-colors"
>
```
**Action**: Replace with `Button` component using `ButtonVariant.ICON`

---

## Notes

- All icon buttons should use `ButtonVariant.ICON`
- All structural containers should use appropriate UI components
- Maintain sharp-edge design where specified (no rounded corners on sidebars)
- Keep message bubbles in client app but use UI components internally
- `ModalHeader` exists in UI package but needs Button refactoring
- Export `ModalHeader` from modal index if not already exported
