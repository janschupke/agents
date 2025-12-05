import { AgentArchetype } from '../../../../types/agent-archetype.types';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Avatar, Badge, Table } from '@openai/ui';
import { IconEdit, IconTrash } from '../../../../components/ui/Icons';
import { ColumnDef } from '@tanstack/react-table';

interface AgentArchetypeListProps {
  archetypes: AgentArchetype[];
  loading: boolean;
  onEdit: (archetype: AgentArchetype) => void;
  onDelete: (id: number) => void;
}

export default function AgentArchetypeList({
  archetypes,
  loading,
  onEdit,
  onDelete,
}: AgentArchetypeListProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  const columns: ColumnDef<AgentArchetype>[] = [
    {
      accessorKey: 'name',
      header: t('archetypes.form.name') || 'Name',
      cell: ({ row }: { row: { original: AgentArchetype } }) => {
        const archetype = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={archetype.avatarUrl || undefined}
              name={archetype.name}
              size="md"
              borderWidth="none"
              className="w-10 h-10"
            />
            <div>
              <div className="text-sm font-medium text-text-primary">
                {archetype.name}
              </div>
              {archetype.description && (
                <div className="text-xs text-text-secondary line-clamp-1">
                  {archetype.description}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'agentType',
      header: t('archetypes.form.agentType') || 'Type',
      cell: ({ row }: { row: { original: AgentArchetype } }) => {
        const archetype = row.original;
        return (
          <div className="flex flex-wrap gap-2">
            {archetype.agentType && (
              <Badge variant="primary">{archetype.agentType}</Badge>
            )}
            {archetype.language && (
              <Badge variant="secondary">{archetype.language}</Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: t('users.columns.actions') || 'Actions',
      cell: ({ row }: { row: { original: AgentArchetype } }) => {
        const archetype = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="icon"
              size="sm"
              onClick={() => onEdit(archetype)}
              tooltip={t('archetypes.edit')}
            >
              <IconEdit className="w-5 h-5" />
            </Button>
            <Button
              variant="icon"
              size="sm"
              onClick={() => onDelete(archetype.id)}
              tooltip={t('archetypes.delete')}
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
      data={archetypes}
      columns={columns}
      loading={loading}
      emptyMessage={t('archetypes.empty')}
    />
  );
}
