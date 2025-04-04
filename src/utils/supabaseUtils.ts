
import { supabase } from "@/integrations/supabase/client";

// Habilitar realtime para las tablas
export const enableRealtimeForTables = async () => {
  // Asegurarnos de que las tablas tengan Replica Identity Full
  try {
    await supabase.rpc('alter_table_replica_identity', { table_name: 'conversations', replica_type: 'full' } as any);
    await supabase.rpc('alter_table_replica_identity', { table_name: 'messages', replica_type: 'full' } as any);
    await supabase.rpc('alter_table_replica_identity', { table_name: 'rag_sources', replica_type: 'full' } as any);
    await supabase.rpc('alter_table_replica_identity', { table_name: 'rag_chunks', replica_type: 'full' } as any);
    await supabase.rpc('alter_table_replica_identity', { table_name: 'attachments', replica_type: 'full' } as any);
    
    console.log('Realtime configurado correctamente para todas las tablas');
  } catch (error) {
    console.error('Error al configurar realtime:', error);
  }
};

// Configurar las tablas para publicaciones
export const enableRealtimePublications = async () => {
  try {
    // Esta función se usaría si necesitamos configurar publicaciones personalizadas
    // Pero por defecto, Supabase ya configura esto automáticamente
    console.log('Publicaciones realtime ya configuradas por Supabase');
  } catch (error) {
    console.error('Error al configurar las publicaciones:', error);
  }
};
