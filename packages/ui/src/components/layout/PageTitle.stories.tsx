import type { Meta, StoryObj } from '@storybook/react';
import PageTitle from './PageTitle';

const meta = {
  title: 'Layout/PageTitle',
  component: PageTitle,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Page Title',
  },
};

export const LongTitle: Story = {
  args: {
    children: 'Very Long Page Title That Might Wrap to Multiple Lines',
  },
};

export const WithCustomContent: Story = {
  args: {
    children: (
      <span>
        Settings <span className="text-primary">Page</span>
      </span>
    ),
  },
};
