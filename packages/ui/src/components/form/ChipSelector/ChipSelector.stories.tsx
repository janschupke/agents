import type { Meta, StoryObj } from '@storybook/react';
import ChipSelector from './ChipSelector';
import { useState } from 'react';

const meta: Meta<typeof ChipSelector> = {
  title: 'Form/ChipSelector',
  component: ChipSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChipSelector>;

const sampleOptions = [
  'Technology',
  'Sports',
  'Music',
  'Travel',
  'Food',
  'Art',
  'Science',
  'Literature',
  'Gaming',
  'Fitness',
];

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <ChipSelector
        options={sampleOptions}
        selected={selected}
        onChange={setSelected}
        label="Interests"
      />
    );
  },
};

export const WithPreselected: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(['Technology', 'Music']);
    return (
      <ChipSelector
        options={sampleOptions}
        selected={selected}
        onChange={setSelected}
        label="Interests"
      />
    );
  },
};

export const CustomColumns: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <ChipSelector
        options={sampleOptions}
        selected={selected}
        onChange={setSelected}
        label="Interests"
        columns={5}
      />
    );
  },
};

export const WithHint: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <ChipSelector
        options={sampleOptions}
        selected={selected}
        onChange={setSelected}
        label="Interests"
        hint="Select one or more interests"
      />
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <ChipSelector
        options={sampleOptions}
        selected={selected}
        onChange={setSelected}
        label="Interests"
        error="Please select at least one interest"
      />
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [selected, setSelected] = useState<string[]>(['Technology']);
    return (
      <ChipSelector
        options={sampleOptions}
        selected={selected}
        onChange={setSelected}
        label="Interests"
        disabled
      />
    );
  },
};
