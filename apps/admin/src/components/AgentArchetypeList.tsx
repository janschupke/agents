import { AgentArchetype } from '../types/agent-archetype.types';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Avatar, Badge } from '@openai/ui';
import { IconEdit, IconTrash } from './ui/Icons';

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

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 w-full bg-background-secondary animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (archetypes.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        {t('archetypes.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {archetypes.map((archetype) => (
        <div
          key={archetype.id}
          className="flex items-center gap-4 p-4 bg-background-secondary rounded-lg border border-border"
        >
          <Avatar
            src={archetype.avatarUrl || undefined}
            name={archetype.name}
            size="md"
            borderWidth="none"
            className="w-12 h-12"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">{archetype.name}</h3>
            {archetype.description && (
              <p className="text-sm text-text-secondary mt-1">
                {archetype.description}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {archetype.agentType && (
                <Badge variant="primary">{archetype.agentType}</Badge>
              )}
              {archetype.language && (
                <Badge variant="secondary">{archetype.language}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
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
              className="hover:text-red-500"
            >
              <IconTrash className="w-5 h-5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
