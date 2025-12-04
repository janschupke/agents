import type { Meta, StoryObj } from '@storybook/react';
import FadeIn from './FadeIn';

const meta = {
  title: 'Animation/FadeIn',
  component: FadeIn,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FadeIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-4 bg-primary text-white rounded">Fade In Content</div>
    ),
  },
};

export const WithDelay: Story = {
  args: {
    children: (
      <div className="p-4 bg-primary text-white rounded">Delayed Fade In</div>
    ),
    delay: 500,
  },
};

export const MultipleItems: Story = {
  args: {
    children: <div className="p-4 bg-primary text-white rounded">Item 1</div>,
    delay: 0,
  },
  render: () => (
    <div className="space-y-4">
      <FadeIn delay={0}>
        <div className="p-4 bg-primary text-white rounded">Item 1</div>
      </FadeIn>
      <FadeIn delay={200}>
        <div className="p-4 bg-primary text-white rounded">Item 2</div>
      </FadeIn>
      <FadeIn delay={400}>
        <div className="p-4 bg-primary text-white rounded">Item 3</div>
      </FadeIn>
    </div>
  ),
};
