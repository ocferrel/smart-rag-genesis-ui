
import { supabase } from "@/integrations/supabase/client";
import { Attachment } from "@/types";

export const fetchMessages = async (conversationId: string) => {
  const { data: messages, error } = await supabase.from('messages')
    .select(`
      *,
      attachments(*)
    `)
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
    attachments: message.attachments || []
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
    const { data: message, error: messageError } = await supabase
      .from("messages")
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
        url: attachment.url || null,
        data: attachment.data || null,
        name: attachment.name,
        size: attachment.size || 0,
        mime_type: attachment.mimeType || null,
      }));

      const { data: attachmentData, error: attachmentError } = await supabase
        .from("attachments")
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
        attachments: attachmentData || [],
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
  const { error } = await supabase.from('messages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};
