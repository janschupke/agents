import type { Meta, StoryObj } from '@storybook/react';
import {
  IconPlus,
  IconChat,
  IconSettings,
  IconClose,
  IconSend,
  IconUser,
  IconLogout,
  IconChevronDown,
  IconSearch,
  IconRefresh,
  IconTrash,
  IconPencil,
  IconCheck,
  IconTranslate,
  IconEdit,
  IconUpload,
  IconLoader,
} from './Icons';

const meta = {
  title: 'Components/Icons',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const IconGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
    {children}
  </div>
);

const IconItem = ({ name, icon }: { name: string; icon: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-2 p-4 border border-border rounded-lg">
    <div className="text-text-primary">{icon}</div>
    <span className="text-xs text-text-tertiary text-center">{name}</span>
  </div>
);

export const AllIcons: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">All Icons</h2>
        <IconGrid>
          <IconItem name="Plus" icon={<IconPlus />} />
          <IconItem name="Chat" icon={<IconChat />} />
          <IconItem name="Settings" icon={<IconSettings />} />
          <IconItem name="Close" icon={<IconClose />} />
          <IconItem name="Send" icon={<IconSend />} />
          <IconItem name="User" icon={<IconUser />} />
          <IconItem name="Logout" icon={<IconLogout />} />
          <IconItem name="ChevronDown" icon={<IconChevronDown />} />
          <IconItem name="Search" icon={<IconSearch />} />
          <IconItem name="Refresh" icon={<IconRefresh />} />
          <IconItem name="Trash" icon={<IconTrash />} />
          <IconItem name="Pencil" icon={<IconPencil />} />
          <IconItem name="Check" icon={<IconCheck />} />
          <IconItem name="Translate" icon={<IconTranslate />} />
          <IconItem name="Edit" icon={<IconEdit />} />
          <IconItem name="Upload" icon={<IconUpload />} />
          <IconItem name="Loader" icon={<IconLoader />} />
        </IconGrid>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Sizes</h2>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <IconPlus size="sm" />
            <span className="text-xs text-text-tertiary">Small</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconPlus size="md" />
            <span className="text-xs text-text-tertiary">Medium</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconPlus size="lg" />
            <span className="text-xs text-text-tertiary">Large</span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Colors</h2>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <IconPlus className="text-primary" />
            <span className="text-xs text-text-tertiary">Primary</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconPlus className="text-text-secondary" />
            <span className="text-xs text-text-tertiary">Secondary</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconPlus className="text-red-600" />
            <span className="text-xs text-text-tertiary">Danger</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <IconPlus className="text-green-600" />
            <span className="text-xs text-text-tertiary">Success</span>
          </div>
        </div>
      </div>
    </div>
  ),
};
