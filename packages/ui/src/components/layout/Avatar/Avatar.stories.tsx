import type { Meta, StoryObj } from '@storybook/react';
import Avatar from './Avatar';

const meta = {
  title: 'Layout/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    borderWidth: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInitial: Story = {
  args: {
    name: 'John Doe',
    size: 'md',
  },
};

export const WithImage: Story = {
  args: {
    name: 'Jane Smith',
    src: 'https://i.pravatar.cc/150?img=1',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    name: 'Small Avatar',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    name: 'Large Avatar',
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    name: 'Extra Large',
    size: 'xl',
  },
};

export const NoBorder: Story = {
  args: {
    name: 'No Border',
    size: 'md',
    borderWidth: 'none',
  },
};

export const ThickBorder: Story = {
  args: {
    name: 'Thick Border',
    size: 'lg',
    borderWidth: 'lg',
  },
};
