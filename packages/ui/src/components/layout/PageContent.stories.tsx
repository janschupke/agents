import type { Meta, StoryObj } from '@storybook/react';
import PageContent from './PageContent';

const meta = {
  title: 'Layout/PageContent',
  component: PageContent,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Page Content</h1>
        <p>This is scrollable page content with default padding.</p>
        <div className="space-y-2">
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i}>Content item {i + 1}</p>
          ))}
        </div>
      </div>
    ),
  },
};

export const WithoutScroll: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Non-scrollable Content</h1>
        <p>Content with scrolling disabled.</p>
      </div>
    ),
    disableScroll: true,
  },
};

export const WithAnimation: Story = {
  args: {
    children: (
      <div>
        <h1 className="text-2xl font-bold">Animated Content</h1>
        <p>This content fades in when animateOnChange changes.</p>
      </div>
    ),
    animateOnChange: 1,
    enableAnimation: true,
  },
};
