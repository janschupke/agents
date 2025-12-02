import { useState } from 'react';

interface JsonModalState {
  isOpen: boolean;
  title: string;
  data: unknown;
}

interface SessionNameModalState {
  isOpen: boolean;
  sessionId: number | null;
}

interface UseChatModalsReturn {
  jsonModal: JsonModalState;
  sessionNameModal: SessionNameModalState;
  openJsonModal: (title: string, data: unknown) => void;
  closeJsonModal: () => void;
  openSessionNameModal: (sessionId: number) => void;
  closeSessionNameModal: () => void;
}

/**
 * Manages modal state for chat (JSON viewer and session name editor)
 */
export function useChatModals(): UseChatModalsReturn {
  const [jsonModal, setJsonModal] = useState<JsonModalState>({
    isOpen: false,
    title: '',
    data: null,
  });

  const [sessionNameModal, setSessionNameModal] = useState<SessionNameModalState>({
    isOpen: false,
    sessionId: null,
  });

  const openJsonModal = (title: string, data: unknown) => {
    setJsonModal({ isOpen: true, title, data });
  };

  const closeJsonModal = () => {
    setJsonModal({ isOpen: false, title: '', data: null });
  };

  const openSessionNameModal = (sessionId: number) => {
    setSessionNameModal({ isOpen: true, sessionId });
  };

  const closeSessionNameModal = () => {
    setSessionNameModal({ isOpen: false, sessionId: null });
  };

  return {
    jsonModal,
    sessionNameModal,
    openJsonModal,
    closeJsonModal,
    openSessionNameModal,
    closeSessionNameModal,
  };
}
