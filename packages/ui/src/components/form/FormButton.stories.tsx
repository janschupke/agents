import type { Meta, StoryObj } from '@storybook/react';
import FormButton from './FormButton';

const meta = {
  title: 'Form/FormButton',
  component: FormButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'secondary',
        'danger',
        'icon',
        'ghost',
        'ghost-inverse',
        'icon-compact',
        'message-bubble',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof FormButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Form Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Form Button',
    variant: 'secondary',
  },
};

export const Loading: Story = {
  args: {
    children: 'Saving...',
    variant: 'primary',
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled',
    variant: 'primary',
    disabled: true,
  },
};
