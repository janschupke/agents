# Client App File Structure Refactoring Plan

## Overview
Reorganize client app files logically to follow a consistent, scalable structure that promotes code reusability, maintainability, and clear separation of concerns.

## Target Structure

```
/src
    /components                    # Shared/reusable components across pages
        /component1
            /hooks                 # Component-specific hooks (if any)
            /parts                 # Sub-components or parts (if any)
            Component.tsx
            Component.test.tsx     # Co-located tests
        /component2
            ...
    /constants                     # Application-wide constants
    /contexts                      # React context providers
    /hooks                         # Generic hooks, organized by category
        /mutations                 # Mutation hooks (e.g., use-agent-mutations)
        /queries                   # Query hooks (e.g., use-agents, use-chat)
        /navigation                # Navigation-related hooks
        /ui                        # UI-related hooks (e.g., useConfirm)
        /utils                     # Utility hooks (e.g., use-auto-navigate-to-item)
    /pages                         # Page-level components and logic
        /chat
            /components            # Chat page-specific components
                /chat              # Chat-related components
                    /ChatInput
                        /hooks     # ChatInput-specific hooks (if any)
                        ChatInput.tsx
                        ChatInput.test.tsx
                    /ChatMessages
                        /parts     # Sub-components (e.g., MessageBubble)
                        ChatMessages.tsx
                    /ChatHeader
                        ChatHeader.tsx
                    ...
                /session           # Session-related components
                    /SessionItem
                        SessionItem.tsx
                    /SessionSidebar
                        /hooks     # SessionSidebar-specific hooks (if any)
                        SessionSidebar.tsx
                        SessionSidebar.test.tsx
                    ...
                /markdown          # Markdown-related components
                    /MarkdownContent
                        MarkdownContent.tsx
                    ...
                /translation       # Translation-related components
                    ...
                /agent             # Agent-related components (used in chat page)
                    /AgentSelector # Dropdown for selecting agent in chat page
                        AgentSelector.tsx
                        AgentSelector.test.tsx
            /hooks                 # Chat page hooks
            /utils                 # Chat page utilities
            Chat.tsx               # Main chat page component (rename from ChatRoute.tsx)
        /config
            /components
                /agent
                    /AgentConfig
                        /hooks     # AgentConfig-specific hooks (if any)
                        /parts     # Sub-components (e.g., AgentConfigForm)
                        AgentConfig.tsx
                        AgentConfig.test.tsx
                    /AgentSidebar  # Sidebar for selecting agents in config page
                        AgentSidebar.tsx
                    ...
            /hooks
                /agent             # Agent-related hooks
                /form              # Form-related hooks
                /memory            # Memory-related hooks
                /route             # Route-related hooks
                /ui                # UI-related hooks
            /utils
            Config.tsx             # Main config page component (rename from ConfigRoute.tsx)
        /profile
            /components
                /ApiKeySection
                    ApiKeySection.tsx
                /UserProfile
                    /parts         # Sub-components (e.g., ProfileHeader, UserDetails)
                    UserProfile.tsx
                ...
            /hooks
            /utils
            Profile.tsx            # Main profile page component
    /providers                     # React providers (fix typo: currently "profiders")
        /QueryProvider
            QueryProvider.tsx
            query-client.ts
    /services                      # API and business logic services, organized by category
        /api                       # API-related services
            api-client.ts
            api-manager.ts
            token-provider.ts
        /agent                     # Agent services
            agent.service.ts
        /chat                      # Chat services
            session.service.ts
            message.service.ts
        /memory                    # Memory services
            memory.service.ts
        /translation               # Translation services
            translation.service.ts
            word-translation.service.ts
        /user                      # User services
            user.service.ts
            api-credentials.service.ts
    /test                          # Test utilities and mocks
        /mocks
        /utils
    /types                         # TypeScript type definitions
    /utils                         # Generic utility functions
```

## Principles

1. **Co-location**: Related files (components, hooks, tests, types) should be grouped together
2. **Extract Generic Code**: Move reusable code from page-specific locations to shared locations
3. **Business Logic Separation**: Extract business logic from components into services or hooks
4. **Deduplication**: Identify and consolidate duplicate code patterns
5. **Consistent Naming**: Use consistent naming conventions (PascalCase for components, camelCase for utilities)
6. **Test Co-location**: Keep test files next to the files they test

## Current State Analysis

### Issues Identified

1. **Inconsistent Component Organization**
   - Some components are flat (e.g., `chat/` folder with 15 files)
   - No clear separation between component and its parts/hooks
   - Tests are sometimes co-located, sometimes not

2. **Generic Code in Page-Specific Locations**
   - Some hooks in `/hooks` might be page-specific and should move
   - Some utilities might be generic enough to move to `/utils`

3. **Service Organization**
   - All services are flat in `/services`
   - Should be organized by domain/category

4. **Naming Inconsistencies**
   - Route components named `*Route.tsx` instead of page names
   - Some components don't follow consistent naming
   - AgentSelector is in config page but used in chat page - should be moved

5. **Component Location Issues**
   - `AgentSelector` is located in `/pages/config/components/agent/` but is actually used in the chat page (`ChatAgent.tsx`, `ChatHeader.tsx`)
   - Should be moved to `/pages/chat/components/agent/` to match its usage

6. **Provider Typo**
   - `/providers` is misspelled as `/profiders` in original outline (should be `/providers`)

## Refactoring Tasks

### Phase 1: Foundation & Structure Setup

#### Task 1.1: Fix Provider Directory
- [ ] Verify current directory name (`/providers` vs `/profiders`)
- [ ] Ensure consistency in naming

#### Task 1.2: Organize Services by Category
- [ ] Create service subdirectories:
  - [ ] `/services/api` - Move `api-client.ts`, `api-manager.ts`, `token-provider.ts`
  - [ ] `/services/agent` - Move `agent.service.ts`
    - [ ] Analysis: `agent.service.ts` contains simple CRUD operations (getAll, get, create, update, delete) - single responsibility, keep as one file
  - [ ] `/services/chat` - Split `chat.service.ts` into:
    - [ ] `/services/chat/session/session.service.ts` - Session operations (getSessions, createSession, updateSession, deleteSession, getSessionWithAgent)
    - [ ] `/services/chat/message/message.service.ts` - Message operations (getChatHistory, sendMessage)
    - [ ] Analysis: `chat.service.ts` handles both sessions and messages. While related, splitting provides better separation of concerns and follows single responsibility principle
  - [ ] `/services/memory` - Move `memory.service.ts`
    - [ ] Analysis: `memory.service.ts` contains simple CRUD operations plus summarization - single responsibility, keep as one file
  - [ ] `/services/translation` - Move `translation.service.ts`, `word-translation.service.ts`
  - [ ] `/services/user` - Move `user.service.ts`, `api-credentials.service.ts`
- [ ] Update all imports across the codebase
- [ ] Move corresponding test files to match new structure
- [ ] Split `chat.service.test.ts` into `session.service.test.ts` and `message.service.test.ts`

#### Task 1.3: Organize Generic Hooks by Category
- [ ] Review current hooks in `/hooks` to ensure they're truly generic
- [ ] Organize into subdirectories:
  - [ ] `/hooks/mutations` - Already exists, verify completeness
  - [ ] `/hooks/queries` - Already exists, verify completeness
  - [ ] `/hooks/navigation` - Move navigation-related hooks (e.g., `use-auto-navigate-to-item.ts`)
  - [ ] `/hooks/ui` - Move UI-related hooks (e.g., `useConfirm.tsx`, `use-unsaved-changes-warning.ts`)
  - [ ] `/hooks/utils` - Move utility hooks (e.g., `use-sidebar-loading-state.ts`, `use-token-ready.ts`)
- [ ] Update all imports

### Phase 2: Component Reorganization

#### Task 2.1: Reorganize Shared Components
- [ ] Review `/components` directory
- [ ] Ensure each component has its own folder with co-located files:
  - [ ] `/components/auth/ClerkTokenProvider` - Move `ClerkTokenProvider.tsx` into folder
  - [ ] `/components/auth/UserDropdown` - Move `UserDropdown.tsx` into folder
  - [ ] `/components/layout/TopNavigation` - Already in folder, verify structure
  - [ ] `/components/layout/PageLoadingState` - Already in folder, verify structure

#### Task 2.2: Reorganize Chat Page Components
- [ ] **Chat Components** (`/pages/chat/components/chat/`):
  - [ ] Create `/pages/chat/components/chat/ChatInput/` folder
    - [ ] Move `ChatInput.tsx` and `ChatInput.test.tsx` into folder
    - [ ] Move `use-chat-input-focus.ts` hook from `/pages/chat/hooks/` to `/pages/chat/components/chat/ChatInput/hooks/` if it's ChatInput-specific
    - [ ] Move `use-chat-input.ts` hook similarly if ChatInput-specific
  - [ ] Create `/pages/chat/components/chat/ChatMessages/` folder
    - [ ] Move `ChatMessages.tsx` into folder
    - [ ] Create `/parts` subfolder and move `MessageBubble.tsx` into it
  - [ ] Create `/pages/chat/components/chat/ChatHeader/` folder
    - [ ] Move `ChatHeader.tsx` into folder
  - [ ] Create `/pages/chat/components/chat/ChatContent/` folder
    - [ ] Move `ChatContent.tsx` into folder
  - [ ] Create `/pages/chat/components/chat/ChatAgent/` folder
    - [ ] Move `ChatAgent.tsx` and `ChatAgent.loading.test.tsx` into folder
  - [ ] Create `/pages/chat/components/chat/ChatEmptyState/` folder
    - [ ] Move `ChatEmptyState.tsx` into folder
  - [ ] Create `/pages/chat/components/chat/ChatErrorState/` folder
    - [ ] Move `ChatErrorState.tsx` into folder
  - [ ] Create `/pages/chat/components/chat/ChatLoadingState/` folder
    - [ ] Move `ChatLoadingState.tsx` into folder
  - [ ] Create `/pages/chat/components/chat/ChatPlaceholder/` folder
    - [ ] Move `ChatPlaceholder.tsx` into folder
  - [ ] Create `/pages/chat/components/chat/Skeletons/` folder (or individual folders)
    - [ ] Move `ContainerSkeleton.tsx`, `ContentSkeleton.tsx`, `SidebarSkeleton.tsx` into appropriate structure

- [ ] **Session Components** (`/pages/chat/components/session/`):
  - [ ] Create `/pages/chat/components/session/SessionItem/` folder
    - [ ] Move `SessionItem.tsx` into folder
  - [ ] Create `/pages/chat/components/session/SessionSidebar/` folder
    - [ ] Move `SessionSidebar.tsx` and `SessionSidebar.test.tsx` into folder
  - [ ] Create `/pages/chat/components/session/SessionNameModal/` folder
    - [ ] Move `SessionNameModal.tsx` into folder

- [ ] **Markdown Components** (`/pages/chat/components/markdown/`):
  - [ ] Create `/pages/chat/components/markdown/MarkdownContent/` folder
    - [ ] Move `MarkdownContent.tsx` into folder
  - [ ] Create `/pages/chat/components/markdown/TranslatableMarkdownContent/` folder
    - [ ] Move `TranslatableMarkdownContent.tsx` into folder
  - [ ] Determine if `markdown-components.tsx` should be in a shared location or co-located

- [ ] **Translation Components** (`/pages/chat/components/translation/`):
  - [ ] Create `/pages/chat/components/translation/WordPresenter/` folder
    - [ ] Move `WordPresenter.tsx` into folder
  - [ ] Create `/pages/chat/components/translation/WordTooltip/` folder
    - [ ] Move `WordTooltip.tsx` into folder

#### Task 2.3: Reorganize Config Page Components
- [ ] **Agent Components** (`/pages/config/components/agent/`):
  - [ ] Create `/pages/config/components/agent/AgentConfig/` folder
    - [ ] Move `AgentConfig.tsx`, `AgentConfig.test.tsx`, `AgentConfig.loading.test.tsx` into folder
    - [ ] Create `/parts` subfolder
      - [ ] Move `AgentConfigForm.tsx`, `AgentConfigFormFields.tsx`, `AgentConfigFormSkeleton.tsx` into `/parts`
      - [ ] Move `AgentConfigLoadingState.tsx`, `AgentConfigErrorState.tsx` into `/parts`
      - [ ] Move `BehaviorRulesField.tsx`, `BehaviorRulesField.test.tsx` into `/parts`
      - [ ] Move `MemoriesList.tsx`, `MemoriesSection.tsx` into `/parts`
    - [ ] Move `AgentNameAndAvatar.tsx` into `/parts` or separate component folder
  - [ ] Create `/pages/config/components/agent/AgentSidebar/` folder
    - [ ] Move `AgentSidebar.tsx` into folder
    - [ ] Note: AgentSidebar is the sidebar component for the config page (similar to SessionSidebar in chat page)

#### Task 2.3b: Move AgentSelector to Chat Page
- [ ] **AgentSelector Component** (currently in `/pages/config/components/agent/`):
  - [ ] Create `/pages/chat/components/agent/AgentSelector/` folder
    - [ ] Move `AgentSelector.tsx` and `AgentSelector.test.tsx` from `/pages/config/components/agent/` to `/pages/chat/components/agent/AgentSelector/`
    - [ ] Update all imports (currently used in `ChatAgent.tsx` and `ChatHeader.tsx`)
    - [ ] Note: AgentSelector is a dropdown component used in the chat page, not the config page

#### Task 2.4: Reorganize Profile Page Components
- [ ] Create `/pages/profile/components/ApiKeySection/` folder
  - [ ] Move `ApiKeySection.tsx` into folder
- [ ] Create `/pages/profile/components/UserProfile/` folder
  - [ ] Move `UserProfile.tsx` into folder
  - [ ] Create `/parts` subfolder
    - [ ] Move `ProfileHeader.tsx`, `UserDetails.tsx`, `ProfileSkeleton.tsx` into `/parts`

### Phase 3: Page Component Renaming

#### Task 3.1: Rename Route Components
- [ ] Rename `/pages/chat/ChatRoute.tsx` → `/pages/chat/Chat.tsx`
- [ ] Rename `/pages/config/ConfigRoute.tsx` → `/pages/config/Config.tsx`
- [ ] Rename `/pages/profile/UserProfile.tsx` → `/pages/profile/Profile.tsx` (if it's the main page component)
- [ ] Update all imports and route definitions in `App.tsx`

### Phase 4: Hook Organization & Extraction

#### Task 4.1: Review Chat Page Hooks
- [ ] Analyze each hook in `/pages/chat/hooks/`:
  - [ ] Determine if hook is component-specific → move to component folder
  - [ ] Determine if hook is page-specific → keep in `/pages/chat/hooks/`
  - [ ] Determine if hook is generic → move to `/hooks` with appropriate category
- [ ] Example analysis:
  - [ ] `use-chat-input-focus.ts` - Likely ChatInput-specific → move to `/pages/chat/components/chat/ChatInput/hooks/`
  - [ ] `use-chat-input.ts` - Likely ChatInput-specific → move to `/pages/chat/components/chat/ChatInput/hooks/`
  - [ ] `use-chat-messages.ts` - Likely ChatMessages-specific → move to `/pages/chat/components/chat/ChatMessages/hooks/`
  - [ ] `use-chat-scroll.ts` - Likely ChatMessages-specific → move to `/pages/chat/components/chat/ChatMessages/hooks/`
  - [ ] `use-message-translation.ts` - Likely translation component-specific → move to appropriate component folder
  - [ ] `use-chat-route.ts` - Page-level → keep in `/pages/chat/hooks/`
  - [ ] `use-chat-handlers.ts` - Page-level → keep in `/pages/chat/hooks/`

#### Task 4.2: Review Config Page Hooks
- [ ] Analyze hooks in `/pages/config/hooks/`:
  - [ ] Verify organization by category (agent, form, memory, route, ui)
  - [ ] Move component-specific hooks to component folders
  - [ ] Keep page-level hooks in `/pages/config/hooks/`

#### Task 4.3: Review Profile Page Hooks
- [ ] Analyze hooks in `/pages/profile/hooks/`:
  - [ ] Determine if hooks are component-specific or page-level
  - [ ] Reorganize accordingly

#### Task 4.4: Extract Generic Hooks
- [ ] Review all page-specific hooks for generic patterns
- [ ] Extract reusable logic to `/hooks` with appropriate category
- [ ] Update imports

### Phase 5: Business Logic Extraction

#### Task 5.1: Extract Business Logic from Components
- [ ] Review all components for business logic
- [ ] Extract to:
  - [ ] Services (for API/data operations)
  - [ ] Hooks (for stateful logic)
  - [ ] Utils (for pure functions)
- [ ] Ensure components are primarily presentational

#### Task 5.2: Create Page-Specific Utils
- [ ] Review if utilities exist that should be in page-specific `/utils` folders
- [ ] Create `/pages/chat/utils/` if needed
- [ ] Create `/pages/config/utils/` (already exists, verify completeness)
- [ ] Create `/pages/profile/utils/` if needed

### Phase 6: Code Deduplication

#### Task 6.1: Identify Duplicate Patterns
- [ ] Search for duplicate code patterns:
  - [ ] Loading states
  - [ ] Error states
  - [ ] Empty states
  - [ ] Skeleton components
  - [ ] Form patterns
  - [ ] Modal patterns
- [ ] Create shared components where appropriate
- [ ] Update all usages

#### Task 6.2: Consolidate Similar Components
- [ ] Review skeleton components for consolidation opportunities
- [ ] Review error/empty/loading state components
- [ ] Create generic, reusable versions where possible

### Phase 7: Type Organization

#### Task 7.1: Organize Type Definitions
- [ ] Review `/types` directory
- [ ] Ensure types are co-located with their usage where appropriate
- [ ] Keep shared types in `/types`
- [ ] Consider organizing by domain (e.g., `/types/chat.types.ts`, `/types/agent.types.ts`)

### Phase 8: Testing & Validation

#### Task 8.1: Update Test Imports
- [ ] Update all test file imports to match new structure
- [ ] Ensure test files are co-located with their source files
- [ ] Verify test utilities in `/test` are still accessible

#### Task 8.2: Verify Build & Runtime
- [ ] Run build to ensure no broken imports
- [ ] Run tests to ensure everything passes
- [ ] Manual testing of all pages and features

#### Task 8.3: Update Documentation
- [ ] Update any documentation referencing old file paths
- [ ] Update README if it contains structure information

## Implementation Guidelines

### File Naming Conventions
- Components: PascalCase (e.g., `ChatInput.tsx`)
- Hooks: kebab-case with `use-` prefix (e.g., `use-chat-input.ts`)
- Utils: kebab-case (e.g., `agent.utils.ts`)
- Services: kebab-case with `.service.ts` suffix (e.g., `chat.service.ts`)
- Tests: Same as source file with `.test.tsx` or `.test.ts` suffix

### Import Path Guidelines
- Use absolute imports from `/src` root when possible
- Keep relative imports for co-located files
- Update path aliases if configured in build system

### Component Structure Template
```
/ComponentName
    /hooks              # Component-specific hooks (optional)
        use-component-hook.ts
    /parts              # Sub-components (optional)
        SubComponent.tsx
    ComponentName.tsx
    ComponentName.test.tsx
    index.ts            # Re-exports (optional, for cleaner imports)
```

## Migration Strategy

1. **Incremental Approach**: Refactor one section at a time (e.g., services first, then components)
2. **Test After Each Phase**: Ensure tests pass after each major reorganization
3. **Update Imports Systematically**: Use find/replace or automated tools where safe
4. **Version Control**: Commit after each completed phase for easier rollback if needed

## Success Criteria

- [ ] All files follow the target structure
- [ ] All imports are updated and working
- [ ] All tests pass
- [ ] Application builds successfully
- [ ] No runtime errors
- [ ] Code is more maintainable and easier to navigate
- [ ] Generic code is properly extracted and reusable
- [ ] Business logic is separated from presentation
- [ ] Duplicate code is eliminated or minimized
