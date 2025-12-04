import type { Meta, StoryObj } from '@storybook/react';
import ConfirmModal from './ConfirmModal';
import { useState } from 'react';

const meta = {
  title: 'Modal/ConfirmModal',
  component: ConfirmModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConfirmModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const ConfirmModalWrapper = (props: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded m-4"
      >
        Open Modal
      </button>
      <ConfirmModal
        {...props}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          alert('Confirmed!');
          setIsOpen(false);
        }}
      />
    </>
  );
};

export const Default: Story = {
  args: {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed with this action?',
    onClose: () => {},
    onConfirm: () => {},
  },
  render: () => (
    <ConfirmModalWrapper
      title="Confirm Action"
      message="Are you sure you want to proceed with this action?"
    />
  ),
};

export const Danger: Story = {
  args: {
    isOpen: true,
    title: 'Delete Item',
    message:
      'This action cannot be undone. Are you sure you want to delete this item?',
    confirmVariant: 'danger',
    confirmText: 'Delete',
    onClose: () => {},
    onConfirm: () => {},
  },
  render: () => (
    <ConfirmModalWrapper
      title="Delete Item"
      message="This action cannot be undone. Are you sure you want to delete this item?"
      confirmVariant="danger"
      confirmText="Delete"
    />
  ),
};

export const CustomText: Story = {
  args: {
    isOpen: true,
    title: 'Save Changes',
    message:
      'You have unsaved changes. Do you want to save them before leaving?',
    confirmText: 'Save',
    cancelText: 'Discard',
    onClose: () => {},
    onConfirm: () => {},
  },
  render: () => (
    <ConfirmModalWrapper
      title="Save Changes"
      message="You have unsaved changes. Do you want to save them before leaving?"
      confirmText="Save"
      cancelText="Discard"
    />
  ),
};
