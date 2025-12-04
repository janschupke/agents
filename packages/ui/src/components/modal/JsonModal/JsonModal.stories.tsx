import type { Meta, StoryObj } from '@storybook/react';
import JsonModal from './JsonModal';
import { useState } from 'react';

const meta = {
  title: 'Modal/JsonModal',
  component: JsonModal,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof JsonModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const JsonModalWrapper = (props: { title: string; data: unknown }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded m-4"
      >
        Open JSON Modal
      </button>
      <JsonModal {...props} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export const SimpleObject: Story = {
  args: {
    isOpen: true,
    title: 'User Data',
    data: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
    },
    onClose: () => {},
  },
  render: () => (
    <JsonModalWrapper
      title="User Data"
      data={{
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
      }}
    />
  ),
};

export const ComplexObject: Story = {
  args: {
    isOpen: true,
    title: 'API Response',
    data: {
      status: 'success',
      data: {
        users: [
          { id: 1, name: 'Alice', active: true },
          { id: 2, name: 'Bob', active: false },
        ],
        metadata: {
          total: 2,
          page: 1,
          perPage: 10,
        },
      },
      timestamp: new Date().toISOString(),
    },
    onClose: () => {},
  },
  render: () => (
    <JsonModalWrapper
      title="API Response"
      data={{
        status: 'success',
        data: {
          users: [
            { id: 1, name: 'Alice', active: true },
            { id: 2, name: 'Bob', active: false },
          ],
          metadata: {
            total: 2,
            page: 1,
            perPage: 10,
          },
        },
        timestamp: new Date().toISOString(),
      }}
    />
  ),
};

export const Array: Story = {
  args: {
    isOpen: true,
    title: 'Items List',
    data: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ],
    onClose: () => {},
  },
  render: () => (
    <JsonModalWrapper
      title="Items List"
      data={[
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]}
    />
  ),
};
