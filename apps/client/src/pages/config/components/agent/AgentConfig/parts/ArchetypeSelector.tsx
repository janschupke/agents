import { useAgentArchetypes } from '../../../../../../hooks/queries/use-agent-archetypes';
import { Avatar } from '@openai/ui';
import { AgentArchetype } from '../../../../../../types/agent-archetype.types';
import { useTranslation, I18nNamespace } from '@openai/i18n';

interface ArchetypeSelectorProps {
  selectedArchetypeId: number | null;
  onArchetypeSelect: (archetype: AgentArchetype) => void;
}

export default function ArchetypeSelector({
  selectedArchetypeId,
  onArchetypeSelect,
}: ArchetypeSelectorProps) {
  const { t } = useTranslation(I18nNamespace.CLIENT);
  const { data: archetypes = [], isLoading } = useAgentArchetypes();

  // Don't render if no archetypes exist
  if (!isLoading && archetypes.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-text-secondary mb-3">
          {t('config.archetypes.title')}
        </h3>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-16 h-16 rounded-full bg-background-secondary animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-text-secondary mb-3">
        {t('config.archetypes.title')}
      </h3>
      <div className="flex flex-wrap gap-3">
        {archetypes.map((archetype) => {
          const isSelected = selectedArchetypeId === archetype.id;
          return (
            <button
              key={archetype.id}
              type="button"
              onClick={() => onArchetypeSelect(archetype)}
              className={`
                relative w-16 h-16 rounded-full overflow-hidden
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                ${isSelected ? 'ring-4 ring-primary' : 'ring-2 ring-border'}
                hover:ring-primary hover:ring-4
              `}
              aria-label={archetype.name}
              title={archetype.name}
            >
              <Avatar
                src={archetype.avatarUrl || undefined}
                name={archetype.name}
                size="lg"
                borderWidth="none"
                className="w-full h-full"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
