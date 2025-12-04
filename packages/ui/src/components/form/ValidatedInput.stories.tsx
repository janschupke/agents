import type { Meta, StoryObj } from '@storybook/react';
import ValidatedInput from './ValidatedInput';
import type { ComponentProps } from 'react';

type ValidatedInputProps = ComponentProps<typeof ValidatedInput>;

const meta: Meta<ValidatedInputProps> = {
  title: 'Form/ValidatedInput',
  component: ValidatedInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    touched: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<ValidatedInputProps>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    type: 'text',
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Enter email',
    error: 'Email is required',
    touched: true,
  },
};

export const WithErrorNotTouched: Story = {
  args: {
    placeholder: 'Enter email',
    error: 'Email is required',
    touched: false,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const Email: Story = {
  args: {
    placeholder: 'email@example.com',
    type: 'email',
  },
};

export const Password: Story = {
  args: {
    placeholder: 'Enter password',
    type: 'password',
  },
};
