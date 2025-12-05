import { AgentWithStats } from '../../../../types/agent.types';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Avatar, Badge, Table } from '@openai/ui';
import { IconEdit, IconTrash, IconEye } from '../../../../components/ui/Icons';
import { ColumnDef } from '@tanstack/react-table';

interface AgentListProps {
  agents: AgentWithStats[];
  loading: boolean;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  deletingId: number | null;
}

export default function AgentList({
  agents,
  loading,
  onView,
  onEdit,
  onDelete,
  deletingId,
}: AgentListProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  const columns: ColumnDef<AgentWithStats>[] = [
    {
      accessorKey: 'name',
      header: t('agents.list.name') || 'Name',
      cell: ({ row }: { row: { original: AgentWithStats } }) => {
        const agent = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={agent.avatarUrl || undefined}
              name={agent.name}
              size="md"
              borderWidth="none"
              className="w-10 h-10"
            />
            <div>
              <div className="text-sm font-medium text-text-primary">
                {agent.name}
              </div>
              {agent.description && (
                <div className="text-xs text-text-secondary line-clamp-1">
                  {agent.description}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'agentType',
      header: t('agents.detail.type') || 'Type',
      cell: ({ row }: { row: { original: AgentWithStats } }) => {
        const agent = row.original;
        return (
          <div className="flex flex-wrap gap-2">
            {agent.agentType && (
              <Badge variant="primary">{agent.agentType}</Badge>
            )}
            {agent.language && (
              <Badge variant="secondary">{agent.language}</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'totalMessages',
      header: t('agents.list.messages', { count: 0 }) || 'Messages',
      cell: ({ row }: { row: { original: AgentWithStats } }) => (
        <div className="text-sm text-text-primary">
          {row.original.totalMessages.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'totalTokens',
      header: t('agents.list.tokens', { count: 0 }) || 'Tokens',
      cell: ({ row }: { row: { original: AgentWithStats } }) => (
        <div className="text-sm text-text-primary">
          {row.original.totalTokens.toLocaleString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('users.columns.actions') || 'Actions',
      cell: ({ row }: { row: { original: AgentWithStats } }) => {
        const agent = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="icon"
              size="sm"
              onClick={() => onView(agent.id)}
              tooltip={t('agents.list.view')}
            >
              <IconEye className="w-5 h-5" />
            </Button>
            <Button
              variant="icon"
              size="sm"
              onClick={() => onEdit(agent.id)}
              tooltip={t('agents.list.edit')}
            >
              <IconEdit className="w-5 h-5" />
            </Button>
            <Button
              variant="icon"
              size="sm"
              onClick={() => onDelete(agent.id)}
              disabled={deletingId === agent.id}
              tooltip={t('agents.list.delete')}
              className="hover:text-danger"
            >
              <IconTrash className="w-5 h-5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      data={agents}
      columns={columns}
      loading={loading}
      emptyMessage={t('agents.list.empty')}
    />
  );
}
