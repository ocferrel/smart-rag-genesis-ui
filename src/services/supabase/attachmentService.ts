
import { supabase } from "@/integrations/supabase/client";

export const deleteAttachment = async (id: string) => {
  const { error } = await supabase.from('attachments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
};
