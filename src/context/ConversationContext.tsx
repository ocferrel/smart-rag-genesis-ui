
import React, { createContext, useContext, useState, useEffect } from "react";
import { Conversation, Message, Attachment, RAGSource } from "../types";
import { findRelevantChunks, generateRAGContext } from "../services/ragService";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

interface ConversationContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  sources: RAGSource[];
  isProcessing: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  createConversation: () => string;
  selectConversation: (id: string) => void;
  addMessage: (content: string, role: "user" | "assistant" | "system", attachments?: Attachment[]) => void;
  addSource: (source: RAGSource) => void;
  removeSource: (id: string) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sources, setSources] = useState<RAGSource[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("openrouter_api_key") || "";
  });

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem("conversations");
    const savedSources = localStorage.getItem("rag_sources");
    
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        setConversations(parsed);
        
        // Set the most recent conversation as active
        if (parsed.length > 0) {
          setCurrentConversationId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse saved conversations", e);
      }
    }
    
    if (savedSources) {
      try {
        setSources(JSON.parse(savedSources));
      } catch (e) {
        console.error("Failed to parse saved RAG sources", e);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  // Save sources to localStorage whenever they change
  useEffect(() => {
    if (sources.length > 0) {
      localStorage.setItem("rag_sources", JSON.stringify(sources));
    }
  }, [sources]);

  // Save API key to localStorage whenever it changes
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("openrouter_api_key", apiKey);
    }
  }, [apiKey]);

  const createConversation = () => {
    const id = uuidv4();
    const newConversation: Conversation = {
      id,
      title: `Conversación ${conversations.length + 1}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(id);
    return id;
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  const addMessage = (content: string, role: "user" | "assistant" | "system", attachments?: Attachment[]) => {
    const message: Message = {
      id: uuidv4(),
      content,
      role,
      timestamp: Date.now(),
      attachments,
    };

    setConversations(prev => prev.map(conv => 
      conv.id === currentConversationId 
        ? { 
            ...conv, 
            messages: [...conv.messages, message],
            updatedAt: Date.now(),
            // Update the title if this is the first user message
            title: conv.messages.length === 0 && role === "user" 
              ? content.slice(0, 30) + (content.length > 30 ? "..." : "") 
              : conv.title
          }
        : conv
    ));
  };

  const addSource = (source: RAGSource) => {
    setSources(prev => [...prev, source]);
    toast.success(`Fuente añadida: ${source.name}`);
  };

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(source => source.id !== id));
    toast.info("Fuente eliminada");
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        currentConversationId,
        sources,
        isProcessing,
        apiKey,
        setApiKey,
        createConversation,
        selectConversation,
        addMessage,
        addSource,
        removeSource,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = (): ConversationContextType => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
};
