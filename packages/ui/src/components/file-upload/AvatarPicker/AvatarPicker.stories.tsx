import type { Meta, StoryObj } from '@storybook/react';
import AvatarPicker from './AvatarPicker';
import { useState } from 'react';

const meta = {
  title: 'FileUpload/AvatarPicker',
  component: AvatarPicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AvatarPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

const AvatarPickerWrapper = (props: {
  value?: string | null;
  accept?: string;
  maxSizeMB?: number;
}) => {
  const [value, setValue] = useState<string | null>(props.value || null);

  return (
    <div className="space-y-4">
      <AvatarPicker
        value={value}
        onChange={setValue}
        accept={props.accept}
        maxSizeMB={props.maxSizeMB}
      />
      {value && (
        <div className="text-sm text-text-secondary">
          Current value: {value.substring(0, 50)}...
        </div>
      )}
    </div>
  );
};

export const Default: Story = {
  args: {
    value: null,
    onChange: () => {},
  },
  render: () => <AvatarPickerWrapper />,
};

export const WithInitialValue: Story = {
  args: {
    value: 'https://i.pravatar.cc/150?img=1',
    onChange: () => {},
  },
  render: () => <AvatarPickerWrapper value="https://i.pravatar.cc/150?img=1" />,
};

export const CustomAccept: Story = {
  args: {
    value: null,
    onChange: () => {},
    accept: 'image/png,image/jpeg',
  },
  render: () => <AvatarPickerWrapper accept="image/png,image/jpeg" />,
};

export const CustomMaxSize: Story = {
  args: {
    value: null,
    onChange: () => {},
    maxSizeMB: 2,
  },
  render: () => <AvatarPickerWrapper maxSizeMB={2} />,
};
