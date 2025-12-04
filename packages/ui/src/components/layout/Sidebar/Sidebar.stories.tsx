import type { Meta, StoryObj } from '@storybook/react';
import Sidebar from './Sidebar';
import { SidebarHeader, SidebarContent, SidebarItem } from '../';
import { useState } from 'react';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const SidebarExample = () => {
  const [selected, setSelected] = useState(1);
  
  return (
    <div className="flex h-screen">
      <Sidebar width="md">
        <SidebarHeader title="Navigation" />
        <SidebarContent>
          <SidebarItem
            isSelected={selected === 1}
            onClick={() => setSelected(1)}
            title="Item 1"
            description="Description 1"
          />
          <SidebarItem
            isSelected={selected === 2}
            onClick={() => setSelected(2)}
            title="Item 2"
            description="Description 2"
          />
          <SidebarItem
            isSelected={selected === 3}
            onClick={() => setSelected(3)}
            title="Item 3"
            description="Description 3"
          />
        </SidebarContent>
      </Sidebar>
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold">Main Content</h1>
        <p>Selected: {selected}</p>
      </div>
    </div>
  );
};

export const Default: Story = {
  args: {
    children: (
      <>
        <SidebarHeader title="Sidebar" />
        <SidebarContent>
          <div className="p-4">Sidebar content</div>
        </SidebarContent>
      </>
    ),
  },
};

export const WithItems: Story = {
  args: {
    children: <div>Content</div>,
    width: 'md',
  },
  render: () => <SidebarExample />,
};

export const Small: Story = {
  args: {
    width: 'sm',
    children: (
      <>
        <SidebarHeader title="Small" />
        <SidebarContent>
          <div className="p-4">Small sidebar</div>
        </SidebarContent>
      </>
    ),
  },
};

export const Large: Story = {
  args: {
    width: 'lg',
    children: (
      <>
        <SidebarHeader title="Large" />
        <SidebarContent>
          <div className="p-4">Large sidebar</div>
        </SidebarContent>
      </>
    ),
  },
};

export const CustomWidth: Story = {
  args: {
    width: 300,
    children: (
      <>
        <SidebarHeader title="Custom Width" />
        <SidebarContent>
          <div className="p-4">300px wide sidebar</div>
        </SidebarContent>
      </>
    ),
  },
};
