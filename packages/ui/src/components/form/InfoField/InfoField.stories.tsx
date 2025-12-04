import type { Meta, StoryObj } from '@storybook/react';
import InfoField from './InfoField';

const meta = {
  title: 'Form/InfoField',
  component: InfoField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InfoField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Name',
    value: 'John Doe',
  },
};

export const WithLongValue: Story = {
  args: {
    label: 'Description',
    value: 'This is a longer description that might wrap to multiple lines',
  },
};

export const WithCustomContent: Story = {
  args: {
    label: 'Status',
    value: (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
        Active
      </span>
    ),
  },
};

export const MultipleFields: Story = {
  args: {
    label: 'Email',
    value: 'john@example.com',
  },
  render: () => (
    <div className="space-y-4">
      <InfoField label="Email" value="john@example.com" />
      <InfoField label="Role" value="Administrator" />
      <InfoField label="Created" value="January 1, 2024" />
    </div>
  ),
};
