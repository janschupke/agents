import type { Meta, StoryObj } from '@storybook/react';
import SidebarHeader from './SidebarHeader';
import { IconClose } from '../../Icons';

const meta = {
  title: 'Layout/SidebarHeader',
  component: SidebarHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Sidebar Title',
  },
};

export const WithAction: Story = {
  args: {
    title: 'Sessions',
    action: {
      icon: <IconClose className="w-4 h-4" />,
      onClick: () => alert('Action clicked'),
      tooltip: 'Close sidebar',
    },
  },
};

export const WithDisabledAction: Story = {
  args: {
    title: 'Settings',
    action: {
      icon: <IconClose className="w-4 h-4" />,
      onClick: () => alert('Action clicked'),
      disabled: true,
      tooltip: 'Action disabled',
    },
  },
};
