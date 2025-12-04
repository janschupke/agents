import type { Meta, StoryObj } from '@storybook/react';
import Input from './Input';
import type { ComponentProps } from 'react';

type InputProps = ComponentProps<typeof Input>;

const meta: Meta<InputProps> = {
  title: 'Form/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: 'boolean',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number'],
    },
  },
};

export default meta;
type Story = StoryObj<InputProps>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    type: 'text',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Sample text',
    type: 'text',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const Small: Story = {
  args: {
    placeholder: 'Small input',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    placeholder: 'Large input',
    size: 'lg',
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
