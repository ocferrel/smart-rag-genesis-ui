
import { Attachment, Conversation, Message, RAGSource, SearchResult } from "@/types";

export interface ConversationContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  sources: RAGSource[];
  isProcessing: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  createConversation: () => Promise<string>;
  selectConversation: (id: string) => void;
  addMessage: (content: string, role: "user" | "assistant" | "system", attachments?: Attachment[]) => Promise<string>;
  addSource: (source: Omit<RAGSource, "id" | "chunks">) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;
  searchInternet: (query: string) => Promise<SearchResult[]>;
}
