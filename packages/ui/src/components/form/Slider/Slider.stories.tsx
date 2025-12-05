import type { Meta, StoryObj } from '@storybook/react';
import Slider from './Slider';
import { useState } from 'react';

const meta: Meta<typeof Slider> = {
  title: 'Form/Slider',
  component: Slider,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    return (
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={100}
        label="Slider"
      />
    );
  },
};

export const WithLabels: Story = {
  render: () => {
    const [value, setValue] = useState(0.7);
    return (
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={2}
        step={0.1}
        label="Temperature"
        labels={{
          min: 'Deterministic',
          mid: 'Balanced',
          max: 'Creative',
        }}
        valueFormatter={(val: number) => val.toFixed(2)}
      />
    );
  },
};

export const AgeSlider: Story = {
  render: () => {
    const [value, setValue] = useState(25);
    return (
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={100}
        step={1}
        label="Age"
      />
    );
  },
};

export const WithoutValue: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    return (
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={100}
        label="Slider"
        showValue={false}
      />
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    return (
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={100}
        label="Slider"
        error="This field is required"
      />
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    return (
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={100}
        label="Slider"
        disabled
      />
    );
  },
};
