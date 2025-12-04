import type { Meta, StoryObj } from '@storybook/react';
import FormContainer from './FormContainer';
import { FormField, Input, FormButton } from '../';

const meta = {
  title: 'Form/FormContainer',
  component: FormContainer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    saving: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof FormContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <FormField label="Name" labelFor="name">
          <Input id="name" placeholder="Enter name" />
        </FormField>
        <FormField label="Email" labelFor="email">
          <Input id="email" type="email" placeholder="Enter email" />
        </FormField>
        <FormButton>Submit</FormButton>
      </>
    ),
  },
};

export const WithError: Story = {
  args: {
    error: 'Please fix the errors below',
    children: (
      <>
        <FormField
          label="Name"
          labelFor="name-error"
          error="Name is required"
          touched
        >
          <Input id="name-error" placeholder="Enter name" />
        </FormField>
        <FormButton>Submit</FormButton>
      </>
    ),
  },
};

export const Saving: Story = {
  args: {
    saving: true,
    children: (
      <>
        <FormField label="Name" labelFor="name-saving">
          <Input id="name-saving" placeholder="Enter name" />
        </FormField>
        <FormButton loading>Saving...</FormButton>
      </>
    ),
  },
};
