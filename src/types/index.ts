
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'document' | 'url'; 
  url?: string;
  data?: string; // Base64 encoded data
  name: string;
  size?: number;
  mimeType?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type ModelType = 'google/gemini-2.5-pro-exp-03-25:free' | 'qwen/qwen2.5-vl-3b-instruct:free';

export interface OpenRouterRequest {
  model: ModelType;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string | { type: string; text?: string; image_url?: { url: string } }[];
  }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
}

export interface RAGSource {
  id: string;
  name: string;
  type: 'document' | 'url' | 'text';
  content?: string;
  url?: string;
  chunks?: RAGChunk[];
}

export interface RAGChunk {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
