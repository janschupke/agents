import type { Meta, StoryObj } from '@storybook/react';
import Container from './Container';
import PageHeader from './PageHeader';
import PageContent from './PageContent';

const meta = {
  title: 'Layout/Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <PageHeader title="Container Example" />
        <PageContent>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Page Content</h1>
            <p>This is content inside a Container component.</p>
          </div>
        </PageContent>
      </>
    ),
  },
};

export const WithCustomContent: Story = {
  args: {
    children: (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Custom Content</h1>
        <p>Container with custom content layout.</p>
      </div>
    ),
  },
};
