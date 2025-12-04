import type { Meta, StoryObj } from '@storybook/react';
import FormField from './FormField';
import { Input } from '../';

const meta = {
  title: 'Form/FormField',
  component: FormField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    required: {
      control: 'boolean',
    },
    showError: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email',
    labelFor: 'email',
    children: <Input id="email" placeholder="Enter email" />,
  },
};

export const WithHint: Story = {
  args: {
    label: 'Password',
    labelFor: 'password',
    hint: 'Must be at least 8 characters',
    children: <Input id="password" type="password" placeholder="Enter password" />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    labelFor: 'email-error',
    error: 'Email is required',
    touched: true,
    children: <Input id="email-error" placeholder="Enter email" />,
  },
};

export const Required: Story = {
  args: {
    label: 'Username',
    labelFor: 'username',
    required: true,
    children: <Input id="username" placeholder="Enter username" />,
  },
};

export const WithCustomLabel: Story = {
  args: {
    label: (
      <span>
        Custom <strong>Label</strong>
      </span>
    ),
    labelFor: 'custom',
    children: <Input id="custom" placeholder="Enter value" />,
  },
};
