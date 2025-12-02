import { useState } from 'react';
import { Bot } from '../../../../types/chat.types.js';
import BotSidebar from './BotSidebar.js';
import BotConfigForm from './BotConfigForm.js';
import { PageContainer } from '../../../../components/ui/layout';
import { useBots } from '../../../../hooks/queries/use-bots.js';
import { useBotSelection } from '../../hooks/use-bot-selection.js';
import { useBotConfigOperations } from '../../hooks/use-bot-config-operations.js';
import { LoadingWrapper } from '../../../../components/ui/feedback';

export default function BotConfig() {
  const { data: contextBots = [], isLoading: loadingBots } = useBots();
  const [localBots, setLocalBots] = useState<Bot[]>([]);

  // Bot selection management
  const { currentBotId, setCurrentBotId, bots } = useBotSelection({
    contextBots,
    localBots,
    loadingBots,
  });

  // Bot operations (create, update, delete)
  const { handleSave, handleDelete, handleNewBot, saving } = useBotConfigOperations({
    contextBots,
    localBots,
    setLocalBots,
    currentBotId,
    setCurrentBotId,
  });

  const handleBotSelect = (botId: number) => {
    // Validate bot exists before selecting
    const allBots = [...contextBots, ...localBots];
    if (allBots.some((b) => b.id === botId)) {
      setCurrentBotId(botId);
    }
  };

  const handleBotSave = async (bot: Bot, values: Parameters<typeof handleSave>[1]) => {
    await handleSave(bot, values);
    // Note: handleSave already handles localBots cleanup and currentBotId update
  };

  const currentBot = bots.find((b) => b.id === currentBotId) || null;

  return (
    <PageContainer>
      <div className="flex h-full">
        <LoadingWrapper isLoading={loadingBots} loadingText="Loading bots...">
          <BotSidebar
            bots={bots}
            currentBotId={currentBotId}
            onBotSelect={handleBotSelect}
            onNewBot={handleNewBot}
            onBotDelete={handleDelete}
            loading={loadingBots}
          />
        </LoadingWrapper>
        <div className="flex-1 flex flex-col overflow-hidden">
          <BotConfigForm
            bot={currentBot}
            saving={saving}
            onSaveClick={handleBotSave}
          />
        </div>
      </div>
    </PageContainer>
  );
}
