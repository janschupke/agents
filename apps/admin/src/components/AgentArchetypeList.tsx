import { AgentArchetype } from '../types/agent-archetype.types';
import { useTranslation, I18nNamespace } from '@openai/i18n';
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
          {archetype.avatarUrl ? (
            <img
              src={archetype.avatarUrl}
              alt={archetype.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-text-inverse font-semibold">
              {archetype.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">{archetype.name}</h3>
            {archetype.description && (
              <p className="text-sm text-text-secondary mt-1">
                {archetype.description}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              {archetype.agentType && (
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                  {archetype.agentType}
                </span>
              )}
              {archetype.language && (
                <span className="text-xs px-2 py-1 bg-background-tertiary text-text-secondary rounded">
                  {archetype.language}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(archetype)}
              className="p-2 text-text-secondary hover:text-primary hover:bg-background-tertiary rounded transition-colors"
              title={t('archetypes.edit')}
            >
              <IconEdit className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(archetype.id)}
              className="p-2 text-text-secondary hover:text-red-500 hover:bg-background-tertiary rounded transition-colors"
              title={t('archetypes.delete')}
            >
              <IconTrash className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
