import type { Meta, StoryObj } from '@storybook/react';
import MainTitle from './MainTitle';

const meta = {
  title: 'Layout/MainTitle',
  component: MainTitle,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MainTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Application Title',
  },
};

export const LongTitle: Story = {
  args: {
    children: 'Very Long Application Title That Might Wrap',
  },
};

export const WithCustomContent: Story = {
  args: {
    children: (
      <span>
        App <span className="text-primary">Name</span>
      </span>
    ),
  },
};
