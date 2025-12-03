export interface SavedWord {
  id: number;
  originalWord: string;
  translation: string;
  pinyin: string | null;
  agentId: number | null;
  sessionId: number | null;
  agentName: string | null;
  sessionName: string | null;
  sentences: SavedWordSentence[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedWordSentence {
  id: number;
  sentence: string;
  messageId: number | null;
  createdAt: string;
}

export interface SavedWordMatch {
  originalWord: string;
  savedWordId: number;
  translation: string;
  pinyin: string | null;
}

export interface CreateSavedWordRequest {
  originalWord: string;
  translation: string;
  agentId?: number;
  sessionId?: number;
  sentence?: string;
  messageId?: number;
}

export interface UpdateSavedWordRequest {
  translation?: string;
  pinyin?: string;
}

export interface AddSentenceRequest {
  sentence: string;
  messageId?: number;
}
