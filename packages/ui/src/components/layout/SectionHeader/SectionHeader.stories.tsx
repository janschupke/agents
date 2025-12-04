import type { Meta, StoryObj } from '@storybook/react';
import SectionHeader from './SectionHeader';
import { IconClose } from '../../Icons';

const meta = {
  title: 'Layout/SectionHeader',
  component: SectionHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Section Title',
  },
};

export const WithAction: Story = {
  args: {
    title: 'Settings',
    action: {
      icon: <IconClose className="w-4 h-4" />,
      onClick: () => alert('Clicked'),
      tooltip: 'Close section',
    },
  },
};

export const WithDisabledAction: Story = {
  args: {
    title: 'Section with Disabled Action',
    action: {
      icon: <IconClose className="w-4 h-4" />,
      onClick: () => alert('Clicked'),
      disabled: true,
      tooltip: 'Action disabled',
    },
  },
};
