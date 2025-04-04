
import { supabase } from "@/integrations/supabase/client";
import { Conversation, Message, Attachment, RAGSource, RAGChunk } from "@/types";
import { Database } from "@/integrations/supabase/types";

// Type alias for database tables
type Tables = Database['public']['Tables'];
type ConversationRow = Tables['conversations']['Row'];
type MessageRow = Tables['messages']['Row'];
type AttachmentRow = Tables['attachments']['Row'];
type RAGSourceRow = Tables['rag_sources']['Row'];
type RAGChunkRow = Tables['rag_chunks']['Row'];

// Conversaciones
export const fetchConversations = async () => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  
  return (data || []).map((conv: ConversationRow) => ({
    id: conv.id,
    title: conv.title,
    messages: [],
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
  }));
};

export const createConversation = async (title: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([
      { title }
    ])
    .select()
    .single();
  
  if (error) throw error;
  
  if (!data) throw new Error('No data returned from createConversation');
  
  return {
    id: data.id,
    title: data.title,
    messages: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const updateConversation = async (id: string, title: string) => {
  const { error } = await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() } as any)
    .eq('id', id);
  
  if (error) throw error;
};

export const deleteConversation = async (id: string) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Mensajes
export const fetchMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      attachments (*)
    `)
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map((msg: any) => ({
    id: msg.id,
    content: msg.content,
    role: msg.role,
    timestamp: msg.timestamp,
    attachments: msg.attachments || [],
  }));
};

export const createMessage = async (
  conversationId: string, 
  content: string, 
  role: 'user' | 'assistant' | 'system',
  attachments?: Attachment[]
) => {
  // Primero creamos el mensaje
  const { data: messageData, error: messageError } = await supabase
    .from('messages')
    .insert([
      { 
        conversation_id: conversationId, 
        content, 
        role 
      }
    ] as any)
    .select()
    .single();
  
  if (messageError) throw messageError;
  
  // Actualizamos el timestamp de la conversación
  const { error: updateError } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() } as any)
    .eq('id', conversationId);
  
  if (updateError) throw updateError;
  
  if (!messageData) throw new Error('No data returned from createMessage');
  
  // Si hay adjuntos, los agregamos
  if (attachments && attachments.length > 0) {
    const attachmentsToInsert = attachments.map(attachment => ({
      message_id: messageData.id,
      type: attachment.type,
      name: attachment.name,
      data: attachment.data,
      url: attachment.url,
      size: attachment.size,
      mime_type: attachment.mimeType,
    })) as any[];
    
    const { error: attachmentsError } = await supabase
      .from('attachments')
      .insert(attachmentsToInsert);
    
    if (attachmentsError) throw attachmentsError;
  }
  
  return {
    id: messageData.id,
    content: messageData.content,
    role: messageData.role,
    timestamp: messageData.timestamp,
    attachments: attachments || [],
  };
};

// Fuentes RAG
export const fetchSources = async () => {
  const { data, error } = await supabase
    .from('rag_sources')
    .select('*');
  
  if (error) throw error;
  
  return (data || []).map((source: RAGSourceRow) => ({
    id: source.id,
    name: source.name,
    type: source.type,
    content: source.content,
  }));
};

export const createSource = async (source: Omit<RAGSource, 'id' | 'chunks'>) => {
  const { data, error } = await supabase
    .from('rag_sources')
    .insert([source] as any)
    .select()
    .single();
  
  if (error) throw error;
  
  if (!data) throw new Error('No data returned from createSource');
  
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    content: data.content,
  };
};

export const createChunks = async (sourceId: string, chunks: Omit<RAGChunk, 'id' | 'embedding'>[]) => {
  const chunksToInsert = chunks.map(chunk => ({
    source_id: sourceId,
    content: chunk.content,
    metadata: chunk.metadata,
  })) as any[];
  
  const { data, error } = await supabase
    .from('rag_chunks')
    .insert(chunksToInsert);
  
  if (error) throw error;
  
  return data;
};

export const fetchChunks = async (sourceId: string) => {
  const { data, error } = await supabase
    .from('rag_chunks')
    .select('*')
    .eq('source_id', sourceId);
  
  if (error) throw error;
  
  return (data || []).map((chunk: RAGChunkRow) => ({
    id: chunk.id,
    content: chunk.content,
    metadata: chunk.metadata,
  }));
};

export const deleteSource = async (id: string) => {
  const { error } = await supabase
    .from('rag_sources')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
