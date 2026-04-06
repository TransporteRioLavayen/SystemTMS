// =============================================================================
// SUPABASE CLIENT - LAZY SINGLETON
// =============================================================================
// Infrastructure Layer - Cliente de Supabase para acceder a la base de datos
// Se inicializa lazily para permitir que el servidor inicie primero

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      `❌ Faltan variables de entorno en .env.local:\n` +
      `   - NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}\n` +
      `   - SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅' : '❌'}\n\n` +
      `📝 Verifica que tu .env.local tenga estas variables.`
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
};

// Export default para compatibilidad
const supabase = new Proxy({} as SupabaseClient, {
  get: () => getSupabaseClient(),
  apply: () => getSupabaseClient(),
});

export default supabase;