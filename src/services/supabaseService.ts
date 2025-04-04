import { supabase } from "@/integrations/supabase/client";
import { Conversation, Message, Attachment, RAGSource } from "@/types";

export const fetchConversations = async () => {
  // Using 'as any' to bypass type errors until proper types are established
  const { data, error } = await (supabase.from('conversations') as any)
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return data?.map((conv: any) => ({
    id: conv.id,
    title: conv.title,
    messages: [],
    createdAt: conv.created_at,
    updatedAt: conv.updated_at
  })) || [];
};

export const createConversation = async (title: string) => {
  // Using 'as any' to bypass type errors
  const { data, error } = await (supabase.from('conversations') as any)
    .insert([{ title }])
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  if (!data) {
    throw new Error('No data returned from conversation creation');
  }

  return {
    id: data.id,
    title: data.title,
    messages: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

export const updateConversationTitle = async (id: string, title: string) => {
  // Using 'as any' to bypass type errors
  const { error } = await (supabase.from('conversations') as any)
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

export const deleteConversation = async (id: string) => {
  // Using 'as any' to bypass type errors
  const { error } = await (supabase.from('conversations') as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

export const fetchMessages = async (conversationId: string) => {
  // Using 'as any' to bypass type errors
  const { data: messages, error } = await (supabase.from('messages') as any)
    .select('*, message_attachments(*)')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return messages?.map((message: any) => ({
    id: message.id,
    content: message.content,
    role: message.role,
    timestamp: message.timestamp,
    attachments: message.message_attachments || []
  })) || [];
};

export const createMessage = async (
  conversationId: string,
  content: string,
  role: "user" | "assistant" | "system",
  attachments?: Attachment[]
) => {
  // Prepare the message data
  const messageData = {
    conversation_id: conversationId,
    content: content,
    role: role,
    timestamp: new Date().toISOString(),
  };

  try {
    // Insert the message
    const { data: message, error: messageError } = await (supabase
      .from("messages") as any)
      .insert([messageData])
      .select()
      .single();

    if (messageError) {
      console.error("Error creating message:", messageError);
      throw messageError;
    }

    if (!message) {
      throw new Error("No message returned from message creation");
    }

    // If there are attachments, handle them
    if (attachments && attachments.length > 0) {
      const attachmentInserts = attachments.map((attachment) => ({
        message_id: message.id,
        type: attachment.type,
        url: attachment.url,
        data: attachment.data,
        name: attachment.name,
        size: attachment.size,
        mimeType: attachment.mimeType,
      }));

      const { data: message_attachments, error: attachmentError } = await (supabase
        .from("message_attachments") as any)
        .insert(attachmentInserts)
        .select();

      if (attachmentError) {
        console.error("Error creating attachments:", attachmentError);
        throw attachmentError;
      }

      // Return the new message with attachments
      return {
        id: message.id,
        content: message.content,
        role: message.role,
        timestamp: message.timestamp,
        attachments: message_attachments || [],
      };
    }

    // If no attachments, return the new message without attachments
    return {
      id: message.id,
      content: message.content,
      role: message.role,
      timestamp: message.timestamp,
      attachments: [],
    };
  } catch (error) {
    console.error("Error in createMessage:", error);
    throw error;
  }
};

export const deleteMessage = async (id: string) => {
  // Using 'as any' to bypass type errors
  const { error } = await (supabase.from('messages') as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const deleteAttachment = async (id: string) => {
  // Using 'as any' to bypass type errors
  const { error } = await (supabase.from('message_attachments') as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
};

export const fetchSources = async () => {
  // Using 'as any' to bypass type errors
  const { data, error } = await (supabase.from('rag_sources') as any)
    .select('*');

  if (error) {
    console.error('Error fetching sources:', error);
    throw error;
  }

  return data?.map((source: any) => ({
    id: source.id,
    name: source.name,
    type: source.type,
    content: source.content,
    url: source.url
  })) || [];
};

export const createSource = async (source: Omit<RAGSource, "id" | "chunks">) => {
  // Using 'as any' to bypass type errors
  const { data, error } = await (supabase.from('rag_sources') as any)
    .insert([source])
    .select()
    .single();

  if (error) {
    console.error('Error creating source:', error);
    throw error;
  }

  if (!data) {
    throw new Error('No data returned from source creation');
  }

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    content: data.content,
    url: data.url
  };
};

export const deleteSource = async (id: string) => {
  // Using 'as any' to bypass type errors
  const { error } = await (supabase.from('rag_sources') as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting source:', error);
    throw error;
  }
};
