
import { supabase } from '@/integrations/supabase/client';

export async function initializeDatabase() {
  try {
    console.log('Checking database structure...');
    
    // Check if the conversations table exists
    const { data: conversationsExists, error: conversationsError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
    
    if (conversationsError) {
      console.log('Creating conversations table...');
      // Use both type parameters: return type and params type
      await supabase.rpc<null, Record<string, never>>('initialize_conversations_table', {});
    } else {
      console.log('Conversations table already exists');
    }
    
    // Check if the messages table exists
    const { data: messagesExists, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);
    
    if (messagesError) {
      console.log('Creating messages table...');
      // Use both type parameters: return type and params type
      await supabase.rpc<null, Record<string, never>>('initialize_messages_table', {});
    } else {
      console.log('Messages table already exists');
    }
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
