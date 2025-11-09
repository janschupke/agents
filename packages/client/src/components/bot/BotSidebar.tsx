import { Bot } from '../../types/chat.types.js';
import { IconPlus, IconClose } from '../ui/Icons';
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
      <div className="px-3 py-2.5 bg-background border-b border-border">
        <h3 className="text-sm font-semibold text-text-secondary">Bots</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && bots.length === 0 ? (
          <div className="p-3">
            <SkeletonList count={5} />
          </div>
        ) : bots.length === 0 ? (
          <div className="p-4 text-text-tertiary text-center text-sm">
            No bots yet
          </div>
        ) : (
          <div className="flex flex-col">
            {bots.map((bot) => (
              <div
                key={bot.id}
                className={`flex items-center border-b border-border ${
                  currentBotId === bot.id
                    ? 'bg-primary text-text-inverse'
                    : 'bg-background text-text-primary'
                }`}
              >
                <button
                  onClick={() => onBotSelect(bot.id)}
                  className={`flex-1 px-3 py-2 text-left transition-colors min-w-0 ${
                    currentBotId === bot.id
                      ? 'text-text-inverse'
                      : 'hover:bg-background-tertiary'
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    {bot.name}
                    {bot.id < 0 && (
                      <span className="ml-1.5 text-xs opacity-70">(New)</span>
                    )}
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
                {bot.id < 0 && onBotDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBotDelete(bot.id);
                    }}
                    className="px-2 py-1 text-text-tertiary hover:text-red-500 transition-colors"
                    title="Cancel"
                  >
                    <IconClose className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-2.5 border-t border-border">
        <button
          onClick={onNewBot}
          disabled={loading}
          className="w-full h-8 px-3 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          <IconPlus className="w-4 h-4" />
          <span>New Bot</span>
        </button>
      </div>
    </div>
  );
}
