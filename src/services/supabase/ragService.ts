
import { supabase } from "@/integrations/supabase/client";
import { RAGSource } from "@/types";

export const fetchSources = async (): Promise<RAGSource[]> => {
  const { data, error } = await supabase
    .from('rag_sources')
    .select('*');
  
  if (error) {
    console.error("Error fetching RAG sources:", error);
    throw error;
  }
  
  return data.map(source => ({
    id: source.id,
    name: source.name,
    type: source.type as "document" | "url" | "text",
    content: source.content || "",
    url: source.url || null // We add this with a null fallback
  })) || [];
};

export const createSource = async (data: Omit<RAGSource, "id" | "chunks">): Promise<RAGSource> => {
  const { data: source, error } = await supabase
    .from('rag_sources')
    .insert({
      name: data.name,
      type: data.type,
      content: data.content,
      url: data.url || null
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating source:", error);
    throw error;
  }
  
  return {
    id: source.id,
    name: source.name,
    type: source.type as "document" | "url" | "text",
    content: source.content || "",
    url: source.url || null // Add a null fallback
  };
};

export const deleteSource = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('rag_sources')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("Error deleting source:", error);
    throw error;
  }
};
