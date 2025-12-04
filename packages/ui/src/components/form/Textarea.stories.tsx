import type { Meta, StoryObj } from '@storybook/react';
import Textarea from './Textarea';
import type { ComponentProps } from 'react';

type TextareaProps = ComponentProps<typeof Textarea>;

const meta: Meta<TextareaProps> = {
  title: 'Form/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    rows: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<TextareaProps>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
    rows: 4,
  },
};

export const WithValue: Story = {
  args: {
    value: 'Sample text content',
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled textarea',
    disabled: true,
    rows: 4,
  },
};

export const Large: Story = {
  args: {
    placeholder: 'Large textarea',
    rows: 8,
  },
};
