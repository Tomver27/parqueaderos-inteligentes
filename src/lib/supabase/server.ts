import { createClient } from "@supabase/supabase-js";

// Cliente para uso en el servidor (Server Components, Route Handlers, Server Actions)
// Usa la service role key para saltarse RLS cuando sea necesario
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
