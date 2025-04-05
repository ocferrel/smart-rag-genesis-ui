
import { supabase } from "@/integrations/supabase/client";
import { RAGSource } from "@/types";

export const fetchSources = async () => {
  const { data, error } = await supabase.from('rag_sources')
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
    url: source.url || null // Add a null fallback since this property might not exist
  })) || [];
};

export const createSource = async (source: Omit<RAGSource, "id" | "chunks">) => {
  const { data, error } = await supabase.from('rag_sources')
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
    url: data.url || null // Add a null fallback since this property might not exist
  };
};

export const deleteSource = async (id: string) => {
  const { error } = await supabase.from('rag_sources')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting source:', error);
    throw error;
  }
};
