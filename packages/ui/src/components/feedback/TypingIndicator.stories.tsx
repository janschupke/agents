import type { Meta, StoryObj } from '@storybook/react';
import TypingIndicator from './TypingIndicator';

const meta = {
  title: 'Feedback/TypingIndicator',
  component: TypingIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TypingIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomColor: Story = {
  args: {
    className: 'text-primary',
  },
};

export const InMessage: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-sm text-text-secondary">AI is typing</span>
      <TypingIndicator />
    </div>
  ),
};
