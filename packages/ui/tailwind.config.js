/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors - can be overridden by apps via CSS variables
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          light: 'rgb(var(--color-primary-light) / <alpha-value>)',
        },
        // Background colors - shared across all apps
        background: {
          DEFAULT: 'rgb(var(--color-background) / <alpha-value>)',
          secondary: 'rgb(var(--color-background-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-background-tertiary) / <alpha-value>)',
        },
        // Text colors - shared across all apps
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--color-text-tertiary) / <alpha-value>)',
          inverse: 'rgb(var(--color-text-inverse) / <alpha-value>)',
        },
        // Border colors - shared across all apps
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          focus: 'rgb(var(--color-border-focus) / <alpha-value>)',
          input: 'rgb(var(--color-border-input) / <alpha-value>)',
        },
        // Message colors - can be overridden by apps
        message: {
          user: 'rgb(var(--color-message-user) / <alpha-value>)',
          assistant: 'rgb(var(--color-message-assistant) / <alpha-value>)',
          'user-text': 'rgb(var(--color-message-user-text) / <alpha-value>)',
          'assistant-text':
            'rgb(var(--color-message-assistant-text) / <alpha-value>)',
        },
        // Disabled colors - shared across all apps
        disabled: {
          DEFAULT: 'rgb(var(--color-disabled) / <alpha-value>)',
          bg: 'rgb(var(--color-disabled-bg) / <alpha-value>)',
        },
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionDuration: {
        'fade-in': '200ms',
        'fade-out': '150ms',
      },
      transitionTimingFunction: {
        fade: 'ease-in-out',
      },
    },
  },
  plugins: [],
};
