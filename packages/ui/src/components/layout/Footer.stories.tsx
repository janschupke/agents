import type { Meta, StoryObj } from '@storybook/react';
import Footer from './Footer';

const meta = {
  title: 'Layout/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="h-screen flex flex-col">
      <div className="flex-1 bg-background-secondary p-8">
        <h1 className="text-2xl font-bold mb-4">Page Content</h1>
        <p>This is the main content area. The footer is at the bottom.</p>
      </div>
      <Footer />
    </div>
  ),
};
