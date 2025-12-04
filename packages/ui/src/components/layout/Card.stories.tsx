import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';

const meta = {
  title: 'Layout/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['default', 'outlined', 'elevated'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Card content',
    padding: 'md',
    variant: 'default',
  },
};

export const Outlined: Story = {
  args: {
    children: 'Outlined card',
    padding: 'md',
    variant: 'outlined',
  },
};

export const Elevated: Story = {
  args: {
    children: 'Elevated card with shadow',
    padding: 'md',
    variant: 'elevated',
  },
};

export const NoPadding: Story = {
  args: {
    children: <div className="p-4">Content with custom padding</div>,
    padding: 'none',
    variant: 'outlined',
  },
};

export const SmallPadding: Story = {
  args: {
    children: 'Card with small padding',
    padding: 'sm',
  },
};

export const LargePadding: Story = {
  args: {
    children: 'Card with large padding',
    padding: 'lg',
  },
};

export const WithContent: Story = {
  args: {
    padding: 'md',
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-sm text-text-secondary">
          This is a card with more complex content including a title and description.
        </p>
      </div>
    ),
  },
};
