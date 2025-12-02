# Client App Layout Refactoring Plan

## Overview

This document outlines the refactoring plan to create a consistent, structured layout system for the client application. The goal is to establish clear component boundaries, eliminate redundant markup, and create reusable layout components.

## Current State Analysis

### Existing Components
- **PageContainer** (`packages/ui/src/components/layout/PageContainer.tsx`): Basic container, currently just a wrapper div
- **PageHeader** (`packages/ui/src/components/layout/PageHeader.tsx`): Header component with title and actions, uses h2
- **Sidebar** (`packages/ui/src/components/layout/Sidebar.tsx`): Sidebar container component
- **SidebarHeader** (`packages/ui/src/components/layout/SidebarHeader.tsx`): Sidebar header with title and optional action button (e.g., plus button)
- **SidebarItem** (`packages/ui/src/components/layout/SidebarItem.tsx`): Sidebar item with selection state
- **AppHeader** (`apps/client/src/App.tsx`): Top navigation with app title and navigation links
- **AppFooter** (`apps/client/src/App.tsx`): Footer component
- **PageTransition** (`packages/ui/src/components/animation/PageTransition.tsx`): Wrapper component for route change animations
- **FadeIn** (`packages/ui/src/components/animation/FadeIn.tsx`): Wrapper component for fade-in animations
- **FadeTransition** (`packages/ui/src/components/animation/FadeTransition.tsx`): Wrapper component for conditional fade transitions

### Current Page Structures

1. **ChatAgent** (`apps/client/src/pages/chat/components/chat/ChatAgent.tsx`):
   - Uses `PageContainer`
   - Has `SessionSidebar` on left
   - Content area with `ChatHeader` and `ChatContent`
   - Inline flex layout with manual spacing

2. **AgentConfig** (`apps/client/src/pages/config/components/agent/AgentConfig.tsx`):
   - Uses `PageContainer`
   - Has `AgentSidebar` on left
   - Content area with `AgentConfigForm`
   - Inline flex layout with manual spacing

3. **UserProfile** (`apps/client/src/pages/profile/components/UserProfile.tsx`):
   - Uses `PageContainer`
   - Uses `PageHeader` with title
   - Content area with manual padding (`p-8`)
   - No sidebar

### Issues Identified

1. **Inconsistent Structure**: Each page implements its own layout structure
2. **Redundant Markup**: Extra divs with spacing/padding scattered throughout
3. **No Unified Container**: No consistent Container component for content areas
4. **Title Hierarchy**: MainTitle (h1) and PageTitle (h2) not extracted as components
5. **Top Navigation**: Currently embedded in App.tsx, should be a separate component
6. **SidebarItem**: Doesn't accept title, description, and action items as props (currently uses primaryText/secondaryText)
7. **Layout Spacing**: Spacing/padding defined in multiple places instead of structural components
8. **Animation Wrappers**: Transition animations implemented as wrapper components (PageTransition, FadeIn) instead of being built into structural components
9. **SidebarHeader**: Already exists but not mentioned in architecture - should be part of Sidebar structure

## Target Architecture

### Component Hierarchy

```
PageContainer
├── TopNavigation (h1: MainTitle) - static, no animation
├── ContentWrapper (with route transition animation - on top nav clicks)
│   ├── Sidebar (optional) - static, but inside animated wrapper
│   │   ├── SidebarHeader (title + action button)
│   │   └── SidebarItem[] (title, description, actions)
│   └── Container - static, but inside animated wrapper
│       ├── PageHeader
│       │   ├── PageTitle (h2)
│       │   └── Actions
│       └── PageContent (with sidebar item change animation - on sidebar clicks)
└── Footer - static, no animation
```

**Animation Behavior**:
- **Top Nav Clicks (Route Changes)**: ContentWrapper animates (fades in) - includes both Sidebar + Container
- **Sidebar Item Clicks**: Only PageContent animates (fades in) - Sidebar and PageHeader remain static

### Component Specifications

#### 1. PageContainer
**Location**: `packages/ui/src/components/layout/PageContainer.tsx`

**Purpose**: Main structural container for all pages

**Structure**:
- Contains TopNavigation, Sidebar (optional), Container, Footer
- Defines main layout grid/flex structure
- Handles overflow and height management
- No padding/margins (only structural layout)

**Props**:
```typescript
interface PageContainerProps {
  children: ReactNode;
  className?: string;
}
```

**Layout**:
- Flex column layout
- Full height/width
- TopNavigation at top
- Main content area (flex row if sidebar exists, otherwise flex column)
- Footer at bottom

**Animation Support**:
- **No animation on PageContainer itself** - TopNavigation and Footer remain static
- Route transitions handled by Container component (see Container specification)
- PageContainer is purely structural

**Props**:
```typescript
interface PageContainerProps {
  children: ReactNode;
  className?: string;
}
```

#### 2. TopNavigation
**Location**: `apps/client/src/components/layout/TopNavigation.tsx` (new)

**Purpose**: Top navigation bar with main app title and navigation links

**Structure**:
- Contains MainTitle (h1) on left
- Navigation links in center/right
- UserDropdown on right
- Border bottom

**Props**:
```typescript
interface TopNavigationProps {
  className?: string;
}
```

**Extracted from**: `App.tsx` AppHeader component

#### 3. MainTitle
**Location**: `packages/ui/src/components/layout/MainTitle.tsx` (new)

**Purpose**: Main application title (h1)

**Props**:
```typescript
interface MainTitleProps {
  children: ReactNode;
  className?: string;
}
```

**Renders**: `<h1>` element

#### 4. Sidebar
**Location**: `packages/ui/src/components/layout/Sidebar.tsx` (existing, may need updates)

**Purpose**: Left sidebar container

**Current**: Already exists, may need minor adjustments for new structure

**Structure**:
- Contains SidebarHeader and SidebarContent/SidebarItem components
- No changes needed to Sidebar itself

#### 5. SidebarHeader
**Location**: `packages/ui/src/components/layout/SidebarHeader.tsx` (existing)

**Purpose**: Sidebar header with title and optional action button (e.g., plus button for creating new items)

**Current**: Already exists and works well

**Structure**:
- Title (h3) on left
- Optional action button on right (typically plus icon for "New" actions)
- Border bottom

**Props** (no changes needed):
```typescript
interface SidebarHeaderProps {
  title: string;
  action?: {
    icon: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    tooltip?: string;
  };
  className?: string;
}
```

**Note**: This component is already correctly implemented and should remain as-is. It's used in both SessionSidebar and AgentSidebar.

#### 6. SidebarItem
**Location**: `packages/ui/src/components/layout/SidebarItem.tsx` (existing, needs refactoring)

**Purpose**: Individual sidebar item with custom content support

**Current Props**:
- `primaryText`: string | ReactNode
- `secondaryText`: string | ReactNode
- `actions`: SidebarItemAction[]

**New Props** (refactored):
```typescript
interface SidebarItemProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  actions?: SidebarItemAction[];
  isSelected: boolean;
  onClick: () => void;
  children?: ReactNode; // Allow custom content
  className?: string;
}
```

**Changes**:
- Rename `primaryText` → `title`
- Rename `secondaryText` → `description`
- Add `children` prop for custom content (e.g., SessionItem, AgentItem)

#### 6. ContentWrapper (for route transitions)
**Location**: `packages/ui/src/components/layout/ContentWrapper.tsx` (new) OR handle in App.tsx

**Purpose**: Wrapper that contains Sidebar + Container and animates on route changes

**Structure**:
- Flex row layout (Sidebar + Container)
- Handles route transition animation
- Contains both Sidebar and Container

**Props**:
```typescript
interface ContentWrapperProps {
  children: ReactNode;
  className?: string;
  enableRouteTransition?: boolean; // Default: true
}
```

**Animation Support**:
- **Route transition animation**: Triggers fade-in animation when route changes (top nav button clicks)
- Animates the entire content area (Sidebar + Container together)
- TopNavigation and Footer remain static (outside ContentWrapper)
- Uses `useLocation` hook internally to detect route changes
- Replaces need for `PageTransition` wrapper

**Alternative**: This could be handled in App.tsx with a wrapper div, or Container could be refactored to wrap both Sidebar and content. For simplicity, we'll use a wrapper div in App.tsx.

#### 7. Container
**Location**: `packages/ui/src/components/layout/Container.tsx` (new)

**Purpose**: Content container with PageHeader and PageContent

**Structure**:
- Flex column layout
- Contains PageHeader and PageContent
- Handles overflow for scrollable content
- No extra padding (only structural)
- No route transition animation (handled by ContentWrapper)

**Props**:
```typescript
interface ContainerProps {
  children: ReactNode;
  className?: string;
}
```

**Usage**:
```tsx
<Container>
  <PageHeader title="..." actions={...} />
  <PageContent>
    {/* page content */}
  </PageContent>
</Container>
```

#### 8. PageHeader
**Location**: `packages/ui/src/components/layout/PageHeader.tsx` (existing, needs updates)

**Purpose**: Page section header with title and actions

**Current**: Uses h2, has title and actions

**Updates**:
- Use PageTitle component (h2) instead of inline h2
- Keep actions support
- No padding (structural only, border-bottom)

**Props**:
```typescript
interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
}
```

#### 9. PageTitle
**Location**: `packages/ui/src/components/layout/PageTitle.tsx` (new)

**Purpose**: Page section title (h2)

**Props**:
```typescript
interface PageTitleProps {
  children: ReactNode;
  className?: string;
}
```

**Renders**: `<h2>` element

#### 10. PageContent
**Location**: `packages/ui/src/components/layout/PageContent.tsx` (new)

**Purpose**: Scrollable content area

**Structure**:
- Flex column
- Overflow-y-auto for scrolling
- Padding for content (only component that should have content padding)
- No extra wrapper divs

**Props**:
```typescript
interface PageContentProps {
  children: ReactNode;
  className?: string;
  animateOnChange?: string | number | null; // Value to watch for changes, triggers fade-in
  enableAnimation?: boolean; // Default: false
}
```

**Animation Support**:
- **Sidebar item change animation**: Optional fade-in animation when `animateOnChange` value changes
- Used when sidebar items are clicked (e.g., agent selection, session selection)
- Only PageContent animates, not the Sidebar or Container
- Useful for animating content when data changes (e.g., agent selection, session change)
- Replaces need for `FadeIn` wrapper components and `useFadeInOnChange` hook

## Animation Refactoring Strategy

### Current Animation Implementation

Currently, animations are implemented as wrapper components:

1. **PageTransition** (`packages/ui/src/components/animation/PageTransition.tsx`):
   - Wraps routes in `App.tsx`
   - Triggers fade-in animation on route changes using `useLocation`
   - Uses `FadeIn` component internally

2. **FadeIn** (`packages/ui/src/components/animation/FadeIn.tsx`):
   - Wrapper component that adds `animate-fade-in` CSS class
   - Used in multiple places:
     - `AgentConfigForm`: Wraps form content when agent changes (via `useFadeInOnChange` hook)
     - `ChatMessages`: Wraps new messages
     - `PageTransition`: Used internally

3. **useFadeInOnChange** hook (`apps/client/src/pages/config/hooks/use-fade-in-on-change.ts`):
   - Returns a key that changes when a value changes
   - Used to trigger re-mounting and fade-in animation
   - Currently used in `AgentConfigForm` to animate when agent selection changes

4. **FadeTransition** (`packages/ui/src/components/animation/FadeTransition.tsx`):
   - Conditional show/hide with fade transition
   - Used for conditional content (e.g., translation panel in MessageBubble)
   - This should remain as-is (not part of layout refactoring)

### Refactoring Approach

Instead of wrapper components, animations should be built directly into structural components:

#### 1. Container - Route Transitions (Top Nav Clicks)

**Current**:
```tsx
<PageTransition>
  <Routes>...</Routes>
</PageTransition>
```

**Refactored**:
```tsx
<PageContainer>
  <TopNavigation />
  <Container enableRouteTransition={true}>
    <PageHeader />
    <PageContent>
      <Routes>...</Routes>
    </PageContent>
  </Container>
  <Footer />
</PageContainer>
```

**Implementation**:
- Move `PageTransition` logic into `Container` (not PageContainer)
- Use `useLocation` hook internally to detect route changes
- Trigger fade-in animation on Container when route changes
- TopNavigation and Footer remain static (outside Container)
- Only the content area (sidebar + container) animates on route changes

#### 2. PageContent - Sidebar Item Change Animations

**Current**:
```tsx
const fadeKey = useFadeInOnChange(agent?.id);
<Container>
  <FadeIn key={fadeKey}>
    {/* content */}
  </FadeIn>
</Container>
```

**Refactored**:
```tsx
<Container animateOnChange={agent?.id} enableAnimation={true}>
  {/* content */}
</Container>
```

**Implementation**:
- Add `animateOnChange` prop to `Container`
- Internally use logic similar to `useFadeInOnChange` hook
- Trigger fade-in animation when `animateOnChange` value changes
- Use key-based re-mounting to trigger animation
- Remove need for `FadeIn` wrapper and `useFadeInOnChange` hook

#### 3. PageContent - Content Change Animations

**Current**:
```tsx
<FadeIn key={messageKey}>
  <MessageBubble />
</FadeIn>
```

**Refactored**:
```tsx
<PageContent animateOnChange={messageId} enableAnimation={true}>
  <MessageBubble />
</PageContent>
```

**Implementation**:
- Add `animateOnChange` prop to `PageContent`
- Support animating individual items within content
- For list items (like messages), may still need per-item animation
- Consider: Keep `FadeIn` for individual list items, but use `PageContent` animation for full content changes

#### 4. Animation Implementation Details

**Internal Animation Logic**:
```typescript
// Inside Container/PageContent component
const [animationKey, setAnimationKey] = useState(0);
const previousValueRef = useRef(animateOnChange);

useEffect(() => {
  if (enableAnimation && animateOnChange !== previousValueRef.current) {
    if (animateOnChange !== null && animateOnChange !== undefined) {
      setAnimationKey(prev => prev + 1);
    }
    previousValueRef.current = animateOnChange;
  }
}, [animateOnChange, enableAnimation]);

return (
  <div
    key={enableAnimation ? animationKey : undefined}
    className={enableAnimation ? 'animate-fade-in' : ''}
  >
    {children}
  </div>
);
```

**Route Transition Logic** (for Container):
```typescript
// Inside Container component
const location = useLocation();
const [routeKey, setRouteKey] = useState(0);

useEffect(() => {
  if (enableRouteTransition) {
    setRouteKey(prev => prev + 1);
  }
}, [location.pathname, enableRouteTransition]);

return (
  <div
    key={enableRouteTransition ? routeKey : undefined}
    className={`flex flex-col flex-1 overflow-hidden ${enableRouteTransition ? 'animate-fade-in' : ''} ${className}`}
  >
    {children}
  </div>
);
```

### Animation Behavior Summary

1. **Top Nav Button Clicks (Route Changes)**:
   - Container animates (fades in) - includes Sidebar + Container content
   - TopNavigation and Footer remain static

2. **Sidebar Item Clicks (e.g., agent/session selection)**:
   - Only PageContent animates (fades in)
   - Sidebar and PageHeader remain static

3. **Individual List Items**:
   - May still use `FadeIn` wrapper for per-item animations (e.g., new chat messages)

### Migration Strategy

1. **Phase 1**: Add animation props to structural components (Container for route transitions, PageContent for sidebar item changes)
2. **Phase 2**: Update pages to use new animation props instead of wrappers
3. **Phase 3**: Remove wrapper components (PageTransition, FadeIn where replaced) or mark as deprecated
4. **Phase 4**: Keep FadeTransition for conditional rendering (not part of layout)

### Benefits

- **Cleaner JSX**: No wrapper components cluttering the component tree
- **Better Performance**: Animations built into structural components reduce DOM nesting
- **Consistent API**: All animations follow same pattern via props
- **Easier Maintenance**: Animation logic centralized in structural components
- **Type Safety**: Animation props are typed and documented

### Edge Cases

1. **List Item Animations**: For animating individual items in a list (like chat messages), may still need `FadeIn` wrapper or consider a `AnimatedListItem` component
2. **Conditional Animations**: `FadeTransition` should remain for conditional show/hide animations
3. **Custom Animations**: Components that need custom animation timing/delays may still use wrapper components

## Implementation Plan

### Phase 1: Create New Components

1. **Create MainTitle component**
   - File: `packages/ui/src/components/layout/MainTitle.tsx`
   - Export from `packages/ui/src/components/layout/index.ts`

2. **Create PageTitle component**
   - File: `packages/ui/src/components/layout/PageTitle.tsx`
   - Export from `packages/ui/src/components/layout/index.ts`

3. **Create Container component**
   - File: `packages/ui/src/components/layout/Container.tsx`
   - Export from `packages/ui/src/components/layout/index.ts`
   - **Note**: No route transition animation (handled by wrapper in App.tsx)

4. **Create PageContent component**
   - File: `packages/ui/src/components/layout/PageContent.tsx`
   - Export from `packages/ui/src/components/layout/index.ts`

5. **Create TopNavigation component**
   - File: `apps/client/src/components/layout/TopNavigation.tsx`
   - Extract from `App.tsx` AppHeader
   - Use MainTitle component

### Phase 2: Refactor Existing Components

6. **Update PageContainer**
   - Add layout structure for TopNavigation, Sidebar, Container, Footer
   - Remove any padding/margins (structural only)
   - **No animation on PageContainer** - it's purely structural
   - TopNavigation and Footer remain static

7. **Update PageHeader**
   - Use PageTitle component instead of inline h2
   - Ensure no padding (only border-bottom)

8. **Refactor SidebarItem**
   - Change `primaryText` → `title`
   - Change `secondaryText` → `description`
   - Add `children` prop for custom content
   - Maintain backward compatibility during transition

9. **Add Route Transition Animation Wrapper**
   - Create wrapper div in App.tsx that contains Sidebar + Container
   - Add route transition logic to this wrapper (using useLocation)
   - This wrapper animates on route changes (top nav clicks)
   - Animates the entire content area (Sidebar + Container together)
   - TopNavigation and Footer remain static
   - **Alternative**: Could create ContentWrapper component, but simpler to handle in App.tsx

10. **Add Animation Support to PageContent**
    - Add `animateOnChange` prop (string | number | null)
    - Add `enableAnimation` prop (default: false)
    - Implement internal animation logic using key-based re-mounting
    - Apply `animate-fade-in` class when animation is enabled

### Phase 3: Update App.tsx

11. **Refactor App.tsx**
    - Extract TopNavigation from AppHeader
    - Update AppContent to use new PageContainer structure
    - Ensure TopNavigation, Footer are part of PageContainer structure
    - **Remove PageTransition wrapper**: Container now handles route transitions internally
    - Remove `PageTransition` import and usage
    - Wrap Routes in Container with `enableRouteTransition={true}`

### Phase 4: Refactor Pages

12. **Refactor ChatAgent page**
    - Remove inline layout divs
    - Use Container with PageHeader and PageContent
    - Update SessionSidebar to use new SidebarItem props
    - Remove manual padding/spacing divs
    - **Animation migration**: Remove any FadeIn wrappers, use Container/PageContent animation props if needed

13. **Refactor AgentConfig page**
    - Remove inline layout divs
    - Use Container with PageHeader and PageContent
    - Update AgentSidebar to use new SidebarItem props
    - Remove manual padding/spacing divs
    - Update AgentConfigForm to use PageHeader/PageContent structure
    - **Animation migration**: 
      - Remove `useFadeInOnChange` hook usage
      - Remove `FadeIn` wrapper from AgentConfigForm
      - Use `PageContent` with `animateOnChange={agent?.id}` and `enableAnimation={true}`
      - This animates only PageContent when agent selection changes (sidebar click)

14. **Refactor UserProfile page**
    - Remove manual padding div (`p-8`)
    - Use Container with PageHeader and PageContent
    - Ensure content is in PageContent

### Phase 5: Cleanup and Verification

15. **Remove redundant markup**
    - Search for extra divs with spacing classes (`p-`, `px-`, `py-`, `space-`, `gap-`)
    - Remove wrapper divs that only add spacing
    - Ensure only structural components define layout/spacing

16. **Update SidebarItem usage**
    - Update SessionItem to use new SidebarItem API
    - Update AgentSidebar to use new SidebarItem API
    - Ensure custom content works correctly

17. **Remove deprecated animation wrappers**
    - Remove `PageTransition` wrapper usage (now in PageContainer)
    - Remove `FadeIn` wrapper usage where replaced by Container/PageContent animations
    - Remove `useFadeInOnChange` hook usage where replaced by Container animation props
    - **Note**: Keep `FadeIn` for individual list items (like chat messages) if needed
    - **Note**: Keep `FadeTransition` for conditional rendering (not part of layout refactoring)

18. **Testing**
    - Verify all pages render correctly
    - Check responsive behavior
    - Verify scrolling works in PageContent
    - Check sidebar interactions
    - Verify navigation works
    - **Verify animations**: Test route transitions, content change animations
    - Verify animations trigger correctly on value changes

## Component File Structure

### New Files to Create

```
packages/ui/src/components/layout/
├── MainTitle.tsx (new)
├── PageTitle.tsx (new)
├── Container.tsx (new)
├── PageContent.tsx (new)
└── index.ts (update exports)

apps/client/src/components/
└── layout/
    └── TopNavigation.tsx (new)
```

### Files to Update

```
packages/ui/src/components/layout/
├── PageContainer.tsx (update)
├── PageHeader.tsx (update)
└── SidebarItem.tsx (refactor)

apps/client/src/
├── App.tsx (refactor)
└── pages/
    ├── chat/components/chat/ChatAgent.tsx (refactor)
    ├── chat/components/session/SessionSidebar.tsx (update)
    ├── config/components/agent/AgentConfig.tsx (refactor)
    ├── config/components/agent/AgentConfigForm.tsx (refactor)
    ├── config/components/agent/AgentSidebar.tsx (update)
    └── profile/components/UserProfile.tsx (refactor)
```

## Detailed Component Specifications

### MainTitle Component

```typescript
// packages/ui/src/components/layout/MainTitle.tsx
import { ReactNode } from 'react';

interface MainTitleProps {
  children: ReactNode;
  className?: string;
}

export default function MainTitle({ children, className = '' }: MainTitleProps) {
  return (
    <h1 className={`text-xl font-semibold text-text-primary ${className}`}>
      {children}
    </h1>
  );
}
```

### PageTitle Component

```typescript
// packages/ui/src/components/layout/PageTitle.tsx
import { ReactNode } from 'react';

interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

export default function PageTitle({ children, className = '' }: PageTitleProps) {
  return (
    <h2 className={`text-lg font-semibold text-text-secondary ${className}`}>
      {children}
    </h2>
  );
}
```

### Container Component

```typescript
// packages/ui/src/components/layout/Container.tsx
import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({ 
  children, 
  className = '',
}: ContainerProps) {
  // Container is purely structural - no route transitions
  // Route transitions handled by wrapper in App.tsx
  return (
    <div className={`flex flex-col flex-1 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
```

### PageContent Component

```typescript
// packages/ui/src/components/layout/PageContent.tsx
import { ReactNode, useEffect, useState, useRef } from 'react';

interface PageContentProps {
  children: ReactNode;
  className?: string;
  animateOnChange?: string | number | null;
  enableAnimation?: boolean;
}

export default function PageContent({ 
  children, 
  className = '',
  animateOnChange,
  enableAnimation = false,
}: PageContentProps) {
  const [animationKey, setAnimationKey] = useState(0);
  const previousValueRef = useRef(animateOnChange);

  useEffect(() => {
    if (enableAnimation && animateOnChange !== previousValueRef.current) {
      if (animateOnChange !== null && animateOnChange !== undefined) {
        setAnimationKey(prev => prev + 1);
      }
      previousValueRef.current = animateOnChange;
    }
  }, [animateOnChange, enableAnimation]);

  return (
    <div
      key={enableAnimation ? animationKey : undefined}
      className={`flex-1 overflow-y-auto p-8 ${enableAnimation ? 'animate-fade-in' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
```

### TopNavigation Component

```typescript
// apps/client/src/components/layout/TopNavigation.tsx
import { useLocation, Link } from 'react-router-dom';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { MainTitle, IconChat, IconSettings } from '@openai/ui';
import UserDropdown from '../auth/UserDropdown';

export default function TopNavigation() {
  const { t: tCommon } = useTranslation(I18nNamespace.COMMON);
  const { t: tClient } = useTranslation(I18nNamespace.CLIENT);
  const location = useLocation();
  const isActiveRoute = (path: string) => location.pathname === path;

  return (
    <header className="bg-background px-6 py-3 border-b border-border flex items-center justify-between">
      <MainTitle>{tCommon('app.title')}</MainTitle>
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <Link
            to="/chat"
            className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActiveRoute('/chat')
                ? 'bg-primary text-text-inverse'
                : 'bg-background text-text-primary hover:bg-background-secondary'
            }`}
            title={tClient('navigation.chat')}
          >
            <IconChat className="w-4 h-4" />
            <span className="hidden sm:inline">
              {tClient('navigation.chat')}
            </span>
          </Link>
          <Link
            to="/config"
            className={`h-8 px-3 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              isActiveRoute('/config')
                ? 'bg-primary text-text-inverse'
                : 'bg-background text-text-primary hover:bg-background-secondary'
            }`}
            title={tClient('navigation.agentConfiguration')}
          >
            <IconSettings className="w-4 h-4" />
            <span className="hidden sm:inline">
              {tClient('navigation.config')}
            </span>
          </Link>
        </div>
        <UserDropdown />
      </div>
    </header>
  );
}
```

### Updated PageContainer

```typescript
// packages/ui/src/components/layout/PageContainer.tsx
import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({
  children,
  className = '',
}: PageContainerProps) {
  // PageContainer is purely structural - no animations
  // TopNavigation and Footer remain static
  // Route transitions handled by Container component
  return (
    <div className={`flex flex-col w-full h-full bg-background overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
```

**Note**: The actual implementation may need to handle TopNavigation and Footer differently. Consider:
- Passing them as props
- Using a layout context
- Or having App.tsx structure them outside PageContainer

**Animation Note**: PageContainer does NOT animate. Route transitions are handled by the Container component, which animates the content area (sidebar + container) while keeping TopNavigation and Footer static.

**Note**: The actual implementation of PageContainer may need to integrate TopNavigation and Footer differently. Consider:
- Passing them as props
- Using a layout context
- Or having App.tsx structure them outside PageContainer

### Updated PageHeader

```typescript
// packages/ui/src/components/layout/PageHeader.tsx
import { ReactNode } from 'react';
import PageTitle from './PageTitle';

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`px-5 py-3 bg-background border-b border-border flex items-center justify-between ${className}`}
    >
      <PageTitle>{title}</PageTitle>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

### Updated SidebarItem

```typescript
// packages/ui/src/components/layout/SidebarItem.tsx
import { ReactNode } from 'react';
import { Button, ButtonVariant } from '../form';

interface SidebarItemAction {
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  tooltip?: string;
}

interface SidebarItemProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  actions?: SidebarItemAction[];
  isSelected: boolean;
  onClick: () => void;
  children?: ReactNode; // Custom content
  className?: string;
}

export default function SidebarItem({
  title,
  description,
  actions,
  isSelected,
  onClick,
  children,
  className = '',
}: SidebarItemProps) {
  // If children provided, render custom content
  if (children) {
    return (
      <div
        className={`group border-b border-border transition-colors ${
          isSelected
            ? 'bg-primary text-text-inverse'
            : 'bg-background text-text-primary hover:bg-background-tertiary'
        } ${className}`}
      >
        {children}
      </div>
    );
  }

  // Default rendering with title/description
  return (
    <div
      className={`group flex items-center border-b border-border transition-colors ${
        isSelected
          ? 'bg-primary text-text-inverse'
          : 'bg-background text-text-primary hover:bg-background-tertiary'
      } ${className}`}
    >
      <button
        onClick={onClick}
        className={`flex-1 px-3 py-2 text-left transition-colors min-w-0 bg-transparent ${
          isSelected ? 'text-text-inverse' : ''
        }`}
      >
        <div className="text-sm font-medium truncate">{title}</div>
        {description && (
          <div
            className={`text-xs mt-0.5 truncate ${
              isSelected ? 'text-text-inverse opacity-80' : 'text-text-tertiary'
            }`}
          >
            {description}
          </div>
        )}
      </button>
      {actions && actions.length > 0 && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={(e) => {
                e?.stopPropagation();
                action.onClick();
              }}
              variant={ButtonVariant.ICON}
              size="sm"
              className={`px-2 py-1 ${
                isSelected
                  ? action.variant === 'danger'
                    ? 'text-text-inverse hover:opacity-100'
                    : 'text-text-inverse hover:opacity-80'
                  : action.variant === 'danger'
                    ? 'text-text-tertiary hover:text-red-500'
                    : 'text-text-tertiary hover:text-text-primary'
              }`}
              tooltip={action.tooltip}
            >
              {action.icon}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Migration Examples

### Example 1: UserProfile Page

**Before**:
```tsx
<PageContainer>
  <div className="flex flex-col h-full overflow-hidden">
    <PageHeader title="User Profile" />
    <div className="flex-1 overflow-y-auto p-8">
      {/* content */}
    </div>
  </div>
</PageContainer>
```

**After**:
```tsx
<PageContainer>
  <Container>
    <PageHeader title="User Profile" />
    <PageContent>
      {/* content */}
    </PageContent>
  </Container>
</PageContainer>
```

### Example 2: AgentConfig Page

**Before**:
```tsx
<PageContainer>
  <div className="flex h-full">
    <AgentSidebar {...props} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <AgentConfigForm {...props} />
    </div>
  </div>
</PageContainer>
```

**After**:
```tsx
<PageContainer>
  <Sidebar>
    <AgentSidebar {...props} />
  </Sidebar>
  <Container>
    <PageHeader title="..." actions={...} />
    <PageContent>
      <AgentConfigForm {...props} />
    </PageContent>
  </Container>
</PageContainer>
```

### Example 3: ChatAgent Page

**Before**:
```tsx
<PageContainer>
  <div className="flex h-full">
    <SessionSidebar {...props} />
    <div className="flex flex-col flex-1 overflow-hidden">
      <ChatHeader />
      <ChatContent {...props} />
    </div>
  </div>
</PageContainer>
```

**After**:
```tsx
<PageContainer>
  <Sidebar>
    <SessionSidebar {...props} />
  </Sidebar>
  <Container>
    <PageHeader title="Chat" />
    <PageContent>
      <ChatContent {...props} />
    </PageContent>
  </Container>
</PageContainer>
```

### Example 4: Animation Migration - AgentConfigForm

**Before** (with wrapper components):
```tsx
const fadeKey = useFadeInOnChange(agent?.id);

<div className="flex-1 flex flex-col overflow-hidden">
  <PageHeader title="..." actions={...} />
  <div className="flex-1 overflow-y-auto p-5">
    <FormContainer saving={saving}>
      {loadingConfig ? (
        <AgentConfigFormSkeleton />
      ) : (
        <FadeIn key={fadeKey}>
          <div className="space-y-5">
            {/* form content */}
          </div>
        </FadeIn>
      )}
    </FormContainer>
  </div>
</div>
```

**After** (with built-in animation):
```tsx
<Container enableRouteTransition={true}>
  <PageHeader title="..." actions={...} />
  <PageContent animateOnChange={agent?.id} enableAnimation={true}>
    <FormContainer saving={saving}>
      {loadingConfig ? (
        <AgentConfigFormSkeleton />
      ) : (
        <div className="space-y-5">
          {/* form content */}
        </div>
      )}
    </FormContainer>
  </PageContent>
</Container>
```

**Note**: 
- Route transitions handled by wrapper in App.tsx (animates Sidebar + Container together)
- `PageContent` handles sidebar item changes (agent selection) - animates only PageContent

### Example 5: Animation Migration - App.tsx Route Transitions

**Before** (with PageTransition wrapper):
```tsx
<main className="flex-1 overflow-hidden">
  <PageTransition>
    <Routes>
      <Route path="/chat" element={<ChatAgent />} />
      <Route path="/config" element={<AgentConfig />} />
      <Route path="/profile" element={<UserProfile />} />
    </Routes>
  </PageTransition>
</main>
```

**After** (with route transition wrapper):
```tsx
// In App.tsx
function RouteTransitionWrapper({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [routeKey, setRouteKey] = useState(0);

  useEffect(() => {
    setRouteKey(prev => prev + 1);
  }, [location.pathname]);

  return (
    <div
      key={routeKey}
      className="flex flex-1 overflow-hidden animate-fade-in"
    >
      {children}
    </div>
  );
}

// Usage
<PageContainer>
  <TopNavigation />
  <RouteTransitionWrapper>
    <Sidebar>...</Sidebar>
    <Container>
      <PageHeader />
      <PageContent>
        <Routes>
          <Route path="/chat" element={<ChatAgent />} />
          <Route path="/config" element={<AgentConfig />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </PageContent>
    </Container>
  </RouteTransitionWrapper>
  <Footer />
</PageContainer>
```

**Note**: 
- `RouteTransitionWrapper` animates on route changes (top nav clicks)
- Animates the entire content area (Sidebar + Container together)
- TopNavigation and Footer remain static (outside the animated wrapper)

## Notes and Considerations

1. **Backward Compatibility**: During migration, maintain backward compatibility for SidebarItem (support both old and new prop names)

2. **Spacing Strategy**: Only PageContent should have content padding. All other components should be structural only.

3. **Grid Layout**: If needed for complex layouts, use CSS Grid within structural components, not extra wrapper divs.

4. **App.tsx Integration**: Consider how TopNavigation and Footer integrate with PageContainer. Options:
   - PageContainer includes them automatically
   - App.tsx structures them outside PageContainer
   - Use a layout context/provider

5. **Responsive Design**: Ensure the new structure works on mobile/tablet. May need responsive variants.

6. **SidebarHeader**: Already correctly implemented with title and action button (plus button). No changes needed - just ensure it's properly documented and used consistently.

7. **Animation Migration**: 
   - Keep `FadeTransition` for conditional rendering (not part of layout refactoring)
   - Keep `FadeIn` for individual list items if needed (e.g., chat messages)
   - All route and content change animations should use built-in props on structural components

8. **Testing**: After refactoring, test:
   - All pages render correctly
   - Scrolling works in PageContent
   - Sidebar interactions
   - Navigation
   - Route transition animations
   - Content change animations (e.g., agent selection)
   - Responsive breakpoints

## Success Criteria

- [ ] All new components created and exported
- [ ] PageContainer has unified structure
- [ ] TopNavigation extracted and uses MainTitle
- [ ] All pages use Container/PageHeader/PageContent structure
- [ ] SidebarItem supports title, description, actions, and custom content
- [ ] SidebarHeader documented and remains as-is (already correctly implemented)
- [ ] No redundant spacing/padding divs
- [ ] All pages refactored to new structure
- [ ] **Animation refactoring complete**:
  - [ ] PageContainer has built-in route transition animation
  - [ ] Container supports `animateOnChange` prop
  - [ ] PageContent supports `animateOnChange` prop
  - [ ] All PageTransition wrappers removed
  - [ ] All FadeIn wrappers removed (where replaced by Container/PageContent)
  - [ ] useFadeInOnChange hook removed (where replaced by Container animation)
  - [ ] Route transitions work correctly
  - [ ] Content change animations work correctly
- [ ] Tests pass
- [ ] Visual regression testing passes
- [ ] Animation testing passes (route transitions, content changes)
- [ ] Code review completed

## Timeline Estimate

- Phase 1 (New Components): 2-3 hours
- Phase 2 (Refactor Existing + Animation Support): 2-3 hours
  - Component refactoring: 1-2 hours
  - Animation integration: 1 hour
- Phase 3 (Update App.tsx): 1 hour
- Phase 4 (Refactor Pages + Animation Migration): 4-5 hours
  - Page structure refactoring: 3-4 hours
  - Animation migration: 1 hour
- Phase 5 (Cleanup/Testing): 2-3 hours
  - Markup cleanup: 1 hour
  - Animation testing: 1 hour
  - General testing: 1 hour

**Total**: ~12-16 hours
