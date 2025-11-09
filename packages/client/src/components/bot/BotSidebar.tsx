import { Bot } from '../../types/chat.types.js';
import { IconPlus, IconTrash } from '../ui/Icons';
import { SkeletonList } from '../ui/Skeleton';

interface BotSidebarProps {
  bots: Bot[];
  currentBotId: number | null;
  onBotSelect: (botId: number) => void;
  onNewBot: () => void;
  loading?: boolean;
  onBotDelete?: (botId: number) => void;
}

export default function BotSidebar({
  bots,
  currentBotId,
  onBotSelect,
  onNewBot,
  loading = false,
  onBotDelete,
}: BotSidebarProps) {
  return (
    <div className="flex flex-col w-56 h-full bg-background-tertiary border-r border-border overflow-hidden">
      <div className="px-3 py-2.5 bg-background border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary">Bots</h3>
        <button
          onClick={onNewBot}
          disabled={loading}
          className="h-6 w-6 flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-background-tertiary rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="New Bot"
        >
          <IconPlus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && bots.length === 0 ? (
          <div className="p-3">
            <SkeletonList count={5} />
          </div>
        ) : bots.length === 0 ? (
          <div className="p-4 text-text-tertiary text-center text-sm">No bots yet</div>
        ) : (
          <div className="flex flex-col">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className={`group flex items-center border-b border-border transition-colors ${
                  currentBotId === bot.id
                    ? 'bg-primary text-text-inverse'
                    : 'bg-background text-text-primary hover:bg-background-tertiary'
                }`}
              >
                <button
                  onClick={() => onBotSelect(bot.id)}
                  className="flex-1 px-3 py-2 text-left transition-colors min-w-0 bg-transparent"
                >
                  <div className={`text-sm font-medium truncate ${
                    currentBotId === bot.id ? 'text-text-inverse' : ''
                  }`}>
                    {bot.name}
                    {bot.id < 0 && <span className="ml-1.5 text-xs opacity-70">(New)</span>}
                  </div>
                  {bot.description && (
                    <div
                      className={`text-xs mt-0.5 truncate ${
                        currentBotId === bot.id
                          ? 'text-text-inverse opacity-80'
                          : 'text-text-tertiary'
                      }`}
                    >
                      {bot.description}
                    </div>
                  )}
                </button>
                {onBotDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBotDelete(bot.id);
                    }}
                    className={`px-2 py-1 transition-colors opacity-0 group-hover:opacity-100 bg-transparent ${
                      currentBotId === bot.id
                        ? 'text-text-inverse hover:opacity-100'
                        : 'text-text-tertiary hover:text-red-500'
                    }`}
                    title={bot.id < 0 ? 'Cancel' : 'Delete bot'}
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
