import type { Meta, StoryObj } from '@storybook/react';
import FadeTransition from './FadeTransition';
import { useState } from 'react';
import Button from '../form/Button';

const meta = {
  title: 'Animation/FadeTransition',
  component: FadeTransition,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FadeTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

const FadeTransitionWrapper = () => {
  const [show, setShow] = useState(true);
  
  return (
    <div className="space-y-4">
      <Button onClick={() => setShow(!show)}>
        {show ? 'Hide' : 'Show'} Content
      </Button>
      <FadeTransition show={show}>
        <div className="p-4 bg-primary text-white rounded">
          This content fades in and out
        </div>
      </FadeTransition>
    </div>
  );
};

export const Default: Story = {
  args: {
    show: true,
    children: <div className="p-4 bg-primary text-white rounded">Content</div>,
  },
  render: () => <FadeTransitionWrapper />,
};

export const Fast: Story = {
  args: {
    show: true,
    children: <div className="p-4 bg-primary text-white rounded">Content</div>,
    duration: 'fast',
  },
  render: () => {
    const [show, setShow] = useState(true);
    return (
      <div className="space-y-4">
        <Button onClick={() => setShow(!show)}>
          {show ? 'Hide' : 'Show'} (Fast)
        </Button>
        <FadeTransition show={show} duration="fast">
          <div className="p-4 bg-primary text-white rounded">
            Fast fade transition
          </div>
        </FadeTransition>
      </div>
    );
  },
};

export const AlwaysVisible: Story = {
  args: {
    show: true,
    children: <div className="p-4 bg-primary text-white rounded">Always visible</div>,
  },
};
