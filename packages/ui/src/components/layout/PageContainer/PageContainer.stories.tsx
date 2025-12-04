import type { Meta, StoryObj } from '@storybook/react';
import PageContainer from './PageContainer';
import { PageHeader, PageContent, Footer } from '../';

const meta = {
  title: 'Layout/PageContainer',
  component: PageContainer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <PageHeader title="Page Title" />
        <PageContent>
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Page Content</h1>
            <p>This is the main content area of the page.</p>
          </div>
        </PageContent>
        <Footer />
      </>
    ),
  },
};

export const WithoutFooter: Story = {
  args: {
    children: (
      <>
        <PageHeader title="Page Without Footer" />
        <PageContent>
          <p>Page content without footer.</p>
        </PageContent>
      </>
    ),
  },
};
