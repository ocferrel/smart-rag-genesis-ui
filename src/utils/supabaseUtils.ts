
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
      // Use a type assertion on the entire function call
      await (supabase.rpc as any)('initialize_conversations_table');
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
      // Use a type assertion on the entire function call
      await (supabase.rpc as any)('initialize_messages_table');
    } else {
      console.log('Messages table already exists');
    }
    
    // Check if we need to create or update RLS policies
    await (supabase.rpc as any)('setup_rls_policies');
    console.log('RLS policies have been configured');
    
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
