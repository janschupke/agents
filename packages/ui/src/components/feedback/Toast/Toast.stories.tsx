import type { Meta, StoryObj } from '@storybook/react';
import Toast from './Toast';
import { useState } from 'react';

const meta = {
  title: 'Feedback/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

const ToastWrapper = ({
  type,
  message,
}: {
  type: 'success' | 'error' | 'info';
  message: string;
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Show Toast
      </button>
    );
  }

  return (
    <Toast message={message} type={type} onClose={() => setIsOpen(false)} />
  );
};

export const Success: Story = {
  args: {
    message: 'Operation completed successfully!',
    type: 'success',
    onClose: () => {},
  },
  render: () => (
    <ToastWrapper type="success" message="Operation completed successfully!" />
  ),
};

export const Error: Story = {
  args: {
    message: 'An error occurred. Please try again.',
    type: 'error',
    onClose: () => {},
  },
  render: () => (
    <ToastWrapper type="error" message="An error occurred. Please try again." />
  ),
};

export const Info: Story = {
  args: {
    message: "Here's some helpful information.",
    type: 'info',
    onClose: () => {},
  },
  render: () => (
    <ToastWrapper type="info" message="Here's some helpful information." />
  ),
};

export const LongMessage: Story = {
  args: {
    message: 'Long message',
    type: 'info',
    onClose: () => {},
  },
  render: () => (
    <ToastWrapper
      type="info"
      message="This is a longer message that demonstrates how the toast handles extended text content that might wrap to multiple lines."
    />
  ),
};
