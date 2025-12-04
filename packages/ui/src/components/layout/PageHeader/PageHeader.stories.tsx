import type { Meta, StoryObj } from '@storybook/react';
import PageHeader from './PageHeader';
import { Button } from '../../form';

const meta = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithTitle: Story = {
  args: {
    title: 'Page Title',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Dashboard',
    actions: (
      <>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Save</Button>
      </>
    ),
  },
};

export const WithCustomLeftContent: Story = {
  args: {
    leftContent: (
      <div className="flex items-center gap-2">
        <span className="text-lg">←</span>
        <span className="font-semibold">Back to List</span>
      </div>
    ),
    actions: <Button variant="primary">Action</Button>,
  },
};

export const Minimal: Story = {
  args: {
    title: 'Settings',
  },
};
