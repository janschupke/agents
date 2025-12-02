import { useEffect } from 'react';
import { useSelectedBot } from '../../../contexts/AppContext';
import { useBots } from '../../../hooks/queries/use-bots.js';

interface UseChatBotOptions {
  propBotId?: number;
}

interface UseChatBotReturn {
  actualBotId: number | null;
  loadingBots: boolean;
}

/**
 * Manages bot selection and initialization for chat
 */
export function useChatBot({ propBotId }: UseChatBotOptions): UseChatBotReturn {
  const { selectedBotId, setSelectedBotId } = useSelectedBot();
  const { data: bots = [], isLoading: loadingBots } = useBots();
  const actualBotId = propBotId || selectedBotId || (bots.length > 0 ? bots[0].id : null);

  // Initialize bot selection
  useEffect(() => {
    if (propBotId) {
      setSelectedBotId(propBotId);
      return;
    }

    if (!loadingBots && bots.length > 0 && !selectedBotId) {
      setSelectedBotId(bots[0].id);
    }
  }, [propBotId, loadingBots, bots, selectedBotId, setSelectedBotId]);

  return {
    actualBotId,
    loadingBots,
  };
}
