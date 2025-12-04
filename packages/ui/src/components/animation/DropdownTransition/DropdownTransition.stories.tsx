import type { Meta, StoryObj } from '@storybook/react';
import DropdownTransition from './DropdownTransition';
import { useState } from 'react';
import { Button } from '../../form';

const meta = {
  title: 'Animation/DropdownTransition',
  component: DropdownTransition,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DropdownTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

const DropdownWrapper = () => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative">
      <Button onClick={() => setShow(!show)}>Toggle Dropdown</Button>
      <DropdownTransition show={show} className="mt-2">
        <div className="bg-background border border-border rounded-md shadow-lg p-4 min-w-[200px]">
          <div className="py-1">
            <button className="block w-full text-left px-3 py-2 hover:bg-background-tertiary rounded">
              Option 1
            </button>
            <button className="block w-full text-left px-3 py-2 hover:bg-background-tertiary rounded">
              Option 2
            </button>
            <button className="block w-full text-left px-3 py-2 hover:bg-background-tertiary rounded">
              Option 3
            </button>
          </div>
        </div>
      </DropdownTransition>
    </div>
  );
};

export const Default: Story = {
  args: {
    show: true,
    children: <div>Dropdown content</div>,
  },
  render: () => <DropdownWrapper />,
};

export const AlwaysVisible: Story = {
  args: {
    show: true,
    children: (
      <div className="bg-background border border-border rounded-md shadow-lg p-4">
        Always visible dropdown content
      </div>
    ),
  },
};
