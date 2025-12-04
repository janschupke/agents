import type { Meta, StoryObj } from '@storybook/react';
import SidebarContent from './SidebarContent';
import { SkeletonList } from '../feedback/Skeleton';
import EmptyState from '../feedback/EmptyState';

const meta = {
  title: 'Layout/SidebarContent',
  component: SidebarContent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SidebarContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-4 space-y-2">
        <div className="p-2 bg-background rounded">Item 1</div>
        <div className="p-2 bg-background rounded">Item 2</div>
        <div className="p-2 bg-background rounded">Item 3</div>
      </div>
    ),
  },
};

export const Loading: Story = {
  args: {
    children: null,
    loading: true,
    loadingComponent: <SkeletonList count={5} />,
  },
};

export const Empty: Story = {
  args: {
    children: null,
    empty: true,
    emptyMessage: <EmptyState message="No items found" />,
  },
};

export const WithScrollableContent: Story = {
  args: {
    children: (
      <div className="space-y-2 p-4">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="p-2 bg-background rounded">
            Scrollable item {i + 1}
          </div>
        ))}
      </div>
    ),
  },
};
