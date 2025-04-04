
import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Conversation, Message, Attachment, RAGSource, SearchResult } from "../types";
import { findRelevantChunks, generateRAGContext } from "../services/ragService";
import { searchWithBrave } from "../services/searchService";
import { toast } from "sonner";
import {
  fetchConversations,
  createConversation as createConversationApi,
  fetchMessages,
  createMessage as createMessageApi,
  deleteMessage as deleteMessageApi,
  deleteAttachment as deleteAttachmentApi,
  fetchSources,
  createSource as createSourceApi,
  deleteSource as deleteSourceApi
} from "../services/supabaseService";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ConversationContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  sources: RAGSource[];
  isProcessing: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  createConversation: () => Promise<string>;
  selectConversation: (id: string) => void;
  addMessage: (content: string, role: "user" | "assistant" | "system", attachments?: Attachment[]) => Promise<void>;
  addSource: (source: Omit<RAGSource, "id" | "chunks">) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;
  searchInternet: (query: string) => Promise<SearchResult[]>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("openrouter_api_key") || "";
  });
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    enabled: isAuthenticated
  });

  // Fetch sources
  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
    enabled: isAuthenticated
  });

  // Find the current conversation
  useEffect(() => {
    if (conversations.length > 0 && !currentConversationId) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations, currentConversationId]);

  // Fetch messages for the current conversation
  useQuery({
    queryKey: ['messages', currentConversationId],
    queryFn: () => currentConversationId ? fetchMessages(currentConversationId) : Promise.resolve([]),
    enabled: !!currentConversationId,
    meta: {
      onSettled: (messages: Message[] | undefined, error: Error | null) => {
        if (messages && !error) {
          queryClient.setQueryData(['conversations'], (oldConversations: Conversation[] | undefined) => {
            if (!oldConversations) return [];
            
            return oldConversations.map(conv => 
              conv.id === currentConversationId 
                ? { ...conv, messages } 
                : conv
            );
          });
        }
      }
    }
  });

  // Save API key to localStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("openrouter_api_key", apiKey);
    }
  }, [apiKey]);

  // Create a new conversation
  const createConversation = async () => {
    try {
      const title = `Conversación ${conversations.length + 1}`;
      const newConversation = await createConversationApi(title);
      
      queryClient.setQueryData(['conversations'], (old: Conversation[] | undefined) => 
        old ? [newConversation, ...old] : [newConversation]
      );
      
      setCurrentConversationId(newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error("Error creating conversation", error);
      toast.error("Error al crear la conversación");
      throw error;
    }
  };

  // Select a conversation
  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
  };

  // Add a message to the current conversation
  const addMessage = async (content: string, role: "user" | "assistant" | "system", attachments?: Attachment[]) => {
    if (!currentConversationId) {
      const newId = await createConversation();
      setCurrentConversationId(newId);
    }
    
    try {
      const newMessage = await createMessageApi(
        currentConversationId!, 
        content, 
        role, 
        attachments
      );
      
      // Update the conversations cache
      queryClient.setQueryData(['conversations'], (oldConversations: Conversation[] | undefined) => {
        if (!oldConversations) return [];
        
        return oldConversations.map(conv => {
          if (conv.id === currentConversationId) {
            const updatedMessages = [...(conv.messages || []), newMessage];
            const updatedTitle = conv.messages.length === 0 && role === "user" 
              ? content.slice(0, 30) + (content.length > 30 ? "..." : "") 
              : conv.title;
            
            return {
              ...conv,
              title: updatedTitle,
              messages: updatedMessages,
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        });
      });
      
      // Update the messages cache
      queryClient.setQueryData(['messages', currentConversationId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [newMessage];
        return [...oldMessages, newMessage];
      });
      
    } catch (error) {
      console.error("Error adding message", error);
      toast.error("Error al añadir el mensaje");
      throw error;
    }
  };

  // Delete a message
  const deleteMessage = async (id: string) => {
    try {
      await deleteMessageApi(id);
      
      // Update the messages cache
      queryClient.setQueryData(['messages', currentConversationId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [];
        return oldMessages.filter(msg => msg.id !== id);
      });
      
      // Update the conversations cache
      queryClient.setQueryData(['conversations'], (oldConversations: Conversation[] | undefined) => {
        if (!oldConversations) return [];
        
        return oldConversations.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: (conv.messages || []).filter(msg => msg.id !== id)
            };
          }
          return conv;
        });
      });
      
      toast.success("Mensaje eliminado");
    } catch (error) {
      console.error("Error deleting message", error);
      toast.error("Error al eliminar el mensaje");
      throw error;
    }
  };

  // Delete an attachment
  const deleteAttachment = async (id: string) => {
    try {
      await deleteAttachmentApi(id);
      
      // Update the messages cache by removing the attachment from the message
      queryClient.setQueryData(['messages', currentConversationId], (oldMessages: Message[] | undefined) => {
        if (!oldMessages) return [];
        
        return oldMessages.map(msg => ({
          ...msg,
          attachments: (msg.attachments || []).filter(att => att.id !== id)
        }));
      });
      
      toast.success("Archivo eliminado");
    } catch (error) {
      console.error("Error deleting attachment", error);
      toast.error("Error al eliminar el archivo");
      throw error;
    }
  };

  // Add a source
  const addSource = async (source: Omit<RAGSource, "id" | "chunks">) => {
    try {
      const newSource = await createSourceApi(source);
      queryClient.setQueryData(['sources'], (old: RAGSource[] | undefined) => 
        old ? [...old, newSource] : [newSource]
      );
      toast.success(`Fuente añadida: ${source.name}`);
    } catch (error) {
      console.error("Error adding source", error);
      toast.error("Error al añadir la fuente");
      throw error;
    }
  };

  // Remove a source
  const removeSource = async (id: string) => {
    try {
      await deleteSourceApi(id);
      queryClient.setQueryData(['sources'], (old: RAGSource[] | undefined) => 
        old ? old.filter(source => source.id !== id) : []
      );
      toast.info("Fuente eliminada");
    } catch (error) {
      console.error("Error removing source", error);
      toast.error("Error al eliminar la fuente");
      throw error;
    }
  };

  // Buscar en internet con Brave
  const searchInternet = async (query: string): Promise<SearchResult[]> => {
    try {
      setIsProcessing(true);
      const results = await searchWithBrave(query);
      
      // Añadir mensaje del usuario
      await addMessage(`Búsqueda en internet: ${query}`, "user");
      
      // Crear un mensaje con los resultados
      const resultsMessage = `## Resultados de búsqueda para: "${query}"\n\n${
        results.map(r => `- **[${r.title}](${r.url})**: ${r.snippet}`).join('\n\n')
      }`;
      
      await addMessage(resultsMessage, "assistant");
      
      return results;
    } catch (error) {
      console.error("Error searching internet", error);
      toast.error("Error al buscar en internet");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const conversationsSubscription = supabase
      .channel('public:conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      })
      .subscribe();

    const messagesSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload: any) => {
        const conversationId = payload.new?.conversation_id || payload.old?.conversation_id;
        if (conversationId) {
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      })
      .subscribe();

    const sourcesSubscription = supabase
      .channel('public:rag_sources')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rag_sources'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['sources'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsSubscription);
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(sourcesSubscription);
    };
  }, [isAuthenticated, queryClient]);

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
        deleteMessage,
        deleteAttachment,
        searchInternet,
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
