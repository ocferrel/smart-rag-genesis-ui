
import { supabase } from "@/integrations/supabase/client";
import { Conversation } from "@/types";

export const fetchConversations = async () => {
  const { data, error } = await supabase.from('conversations')
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
  const { data, error } = await supabase.from('conversations')
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
  const { error } = await supabase.from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

export const deleteConversation = async (id: string) => {
  const { error } = await supabase.from('conversations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};
