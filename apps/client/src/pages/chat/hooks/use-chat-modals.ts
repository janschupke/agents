import { useState } from 'react';

interface JsonModalState {
  isOpen: boolean;
  title: string;
  data: unknown;
}

interface UseChatModalsReturn {
  jsonModal: JsonModalState;
  openJsonModal: (title: string, data: unknown) => void;
  closeJsonModal: () => void;
}

/**
 * Manages modal state for chat (JSON viewer)
 */
export function useChatModals(): UseChatModalsReturn {
  const [jsonModal, setJsonModal] = useState<JsonModalState>({
    isOpen: false,
    title: '',
    data: null,
    });

  const openJsonModal = (title: string, data: unknown) => {
    setJsonModal({ isOpen: true, title, data });
  };

  const closeJsonModal = () => {
    setJsonModal({ isOpen: false, title: '', data: null });
  };

  return {
    jsonModal,
    openJsonModal,
    closeJsonModal,
  };
}
