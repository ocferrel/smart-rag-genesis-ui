
import { supabase } from "@/integrations/supabase/client";

// Function to initialize and migrate database schema (simplified)
export const initializeDatabase = async () => {
  // Define table schema based on our types
  try {
    // Use 'as any' to bypass TypeScript errors for tables
    await (supabase.from('conversations') as any).select('count').limit(1);
    await (supabase.from('messages') as any).select('count').limit(1);
    await (supabase.from('attachments') as any).select('count').limit(1); // Changed from 'message_attachments' to 'attachments'
    await (supabase.from('rag_sources') as any).select('count').limit(1);
    await (supabase.from('rag_chunks') as any).select('count').limit(1);
    console.log('Database schema exists');
    return true;
  } catch (error) {
    console.error('Error checking schema, trying to create tables:', error);
    
    try {
      // Create tables if they don't exist
      await supabase.rpc('create_chat_schema');
      console.log('Created database schema');
      return true;
    } catch (createError) {
      console.error('Error creating schema:', createError);
      return false;
    }
  }
};
