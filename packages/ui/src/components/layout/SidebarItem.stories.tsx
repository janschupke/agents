import type { Meta, StoryObj } from '@storybook/react';
import SidebarItem from './SidebarItem';
import { IconClose, IconEdit } from '../Icons';

const meta = {
  title: 'Layout/SidebarItem',
  component: SidebarItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarItem>;

export default meta;
type Story = StoryObj<typeof meta>;


export const Default: Story = {
  args: {
    isSelected: false,
    title: 'Item Title',
    description: 'Item description',
    onClick: () => {},
  },
};

export const Selected: Story = {
  args: {
    isSelected: true,
    title: 'Selected Item',
    description: 'This item is selected',
    onClick: () => {},
  },
};

export const WithActions: Story = {
  args: {
    isSelected: false,
    title: 'Item with Actions',
    description: 'Hover to see actions',
    onClick: () => {},
    actions: [
      {
        icon: <IconEdit className="w-4 h-4" />,
        onClick: () => alert('Edit clicked'),
        tooltip: 'Edit item',
      },
      {
        icon: <IconClose className="w-4 h-4" />,
        onClick: () => alert('Delete clicked'),
        variant: 'danger',
        tooltip: 'Delete item',
      },
    ],
  },
};

export const SelectedWithActions: Story = {
  args: {
    isSelected: true,
    title: 'Selected with Actions',
    description: 'Actions visible on hover',
    onClick: () => {},
    actions: [
      {
        icon: <IconEdit className="w-4 h-4" />,
        onClick: () => alert('Edit clicked'),
        tooltip: 'Edit item',
      },
    ],
  },
};

export const LongText: Story = {
  args: {
    isSelected: false,
    title: 'Very Long Item Title That Might Wrap to Multiple Lines',
    description: 'This is a very long description that demonstrates how the component handles extended text content',
    onClick: () => {},
  },
};

export const CustomContent: Story = {
  args: {
    isSelected: false,
    onClick: () => {},
    children: (
      <div className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
          A
        </div>
        <div className="flex-1">
          <div className="font-medium">Custom Content</div>
          <div className="text-sm text-text-tertiary">With custom layout</div>
        </div>
      </div>
    ),
  },
};
