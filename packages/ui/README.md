# @openai/ui

Shared UI components package for the OpenAI monorepo.

## Features

- **TypeScript**: Fully typed components
- **Tailwind CSS**: Centralized theme configuration
- **React**: React 18+ compatible components
- **Vite**: Fast build tooling
- **Storybook**: Component documentation and testing

## Theme Configuration

This package provides a centralized Tailwind theme that can be customized by individual apps.

### Brand Colors

Apps can override brand colors by defining CSS variables in their own CSS files:

**Client (Orange theme):**
```css
:root {
  --color-primary: 234 88 12; /* orange-600 */
  --color-primary-hover: 194 65 12; /* orange-700 */
  --color-primary-light: 249 115 22; /* orange-500 */
  --color-border-focus: 234 88 12; /* orange-600 */
  --color-message-user: 234 88 12; /* orange-600 */
}
```

**Admin (Blue theme):**
```css
:root {
  --color-primary: 37 99 235; /* blue-600 */
  --color-primary-hover: 29 78 216; /* blue-700 */
  --color-primary-light: 59 130 246; /* blue-500 */
  --color-border-focus: 37 99 235; /* blue-600 */
  --color-message-user: 37 99 235; /* blue-600 */
}
```

### Shared Theme Variables

The following variables are shared across all apps and should not be overridden:
- Background colors
- Text colors (except message-specific)
- Border colors (except focus)
- Disabled colors
- Shadows
- Design system heights

## Usage

### Importing Styles

In your app's main CSS file, import the base styles:

```css
@import '@openai/ui/styles';
```

Then override brand colors in your app's CSS:

```css
@layer base {
  :root {
    /* Your brand colors */
    --color-primary: 234 88 12;
    /* ... */
  }
}
```

### Using Components

```tsx
import { Button } from '@openai/ui';

function MyComponent() {
  return <Button>Click me</Button>;
}
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Lint
pnpm lint

# Type check
pnpm typecheck

# Test
pnpm test

# Format
pnpm format

# Storybook
pnpm storybook

# Build Storybook
pnpm build-storybook
```
