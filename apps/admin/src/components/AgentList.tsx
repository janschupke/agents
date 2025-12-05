import { AgentWithStats } from '../types/agent.types';
import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Avatar, Badge } from '@openai/ui';
import { IconEdit, IconTrash, IconEye } from './ui/Icons';

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

  if (agents.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        {t('agents.list.empty')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="flex items-center gap-4 p-4 bg-background-secondary rounded-lg border border-border"
        >
          <Avatar
            src={agent.avatarUrl || undefined}
            name={agent.name}
            size="md"
            borderWidth="none"
            className="w-12 h-12"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary">{agent.name}</h3>
            {agent.description && (
              <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                {agent.description}
              </p>
            )}
            <div className="flex gap-2 mt-2 flex-wrap">
              {agent.agentType && (
                <Badge variant="primary">{agent.agentType}</Badge>
              )}
              {agent.language && (
                <Badge variant="secondary">{agent.language}</Badge>
              )}
              <span className="text-xs text-text-tertiary">
                {t('agents.list.messages', { count: agent.totalMessages })}
              </span>
              <span className="text-xs text-text-tertiary">
                {t('agents.list.tokens', { count: agent.totalTokens })}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
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
