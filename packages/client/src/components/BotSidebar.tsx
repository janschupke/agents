import { Bot } from '../types/chat.types.js';

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
    <div className="flex flex-col w-64 h-full bg-background-secondary border-r border-border overflow-hidden">
      <div className="px-4 py-4 bg-background border-b border-border">
        <h3 className="text-lg font-semibold text-text-secondary">Bots</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && bots.length === 0 ? (
          <div className="p-4 text-text-secondary text-center">Loading...</div>
        ) : bots.length === 0 ? (
          <div className="p-4 text-text-secondary text-center">
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
                    : 'bg-background-secondary text-text-primary'
                }`}
              >
                <button
                  onClick={() => onBotSelect(bot.id)}
                  className={`flex-1 px-4 py-3 text-left transition-colors ${
                    currentBotId === bot.id
                      ? 'text-text-inverse'
                      : 'hover:bg-background'
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    {bot.name}
                    {bot.id < 0 && (
                      <span className="ml-2 text-xs opacity-70">(New)</span>
                    )}
                  </div>
                  {bot.description && (
                    <div
                      className={`text-xs mt-1 truncate ${
                        currentBotId === bot.id
                          ? 'text-text-inverse opacity-80'
                          : 'text-text-secondary'
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
                    className="px-2 py-1 text-xs text-red-400 hover:text-red-300 mr-2"
                    title="Cancel"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-border">
        <button
          onClick={onNewBot}
          disabled={loading}
          className="w-full px-4 py-2 bg-primary text-text-inverse border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-primary-hover disabled:bg-disabled disabled:cursor-not-allowed"
        >
          + New Bot
        </button>
      </div>
    </div>
  );
}
