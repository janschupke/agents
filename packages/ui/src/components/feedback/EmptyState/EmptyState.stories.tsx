import type { Meta, StoryObj } from '@storybook/react';
import EmptyState from './EmptyState';
import { IconClose } from '../../Icons';

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No items found',
    message: 'There are no items to display at this time.',
  },
};

export const WithIcon: Story = {
  args: {
    icon: <IconClose className="w-12 h-12 text-text-tertiary" />,
    title: 'No results',
    message: 'Try adjusting your search criteria.',
  },
};

export const WithCustomMessage: Story = {
  args: {
    icon: <div className="w-16 h-16 bg-background-tertiary rounded-full flex items-center justify-center">📭</div>,
    title: 'Inbox Empty',
    message: (
      <div>
        <p>Your inbox is empty.</p>
        <p className="text-xs mt-2">Check back later for new messages.</p>
      </div>
    ),
  },
};

export const Minimal: Story = {
  args: {
    message: 'Nothing here yet',
  },
};
