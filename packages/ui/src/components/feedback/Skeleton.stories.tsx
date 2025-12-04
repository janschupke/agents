import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonMessage, SkeletonList } from './Skeleton';

const meta = {
  title: 'Feedback/Skeleton',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => <Skeleton className="w-64 h-8" />,
};

export const Circle: Story = {
  render: () => <Skeleton className="w-16 h-16 rounded-full" />,
};

export const Card: Story = {
  render: () => (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  ),
};

export const Message: Story = {
  render: () => <SkeletonMessage />,
};

export const List: Story = {
  render: () => <SkeletonList count={5} />,
};

export const MultipleMessages: Story = {
  render: () => (
    <div className="space-y-4">
      <SkeletonMessage />
      <SkeletonMessage />
      <SkeletonMessage />
    </div>
  ),
};
