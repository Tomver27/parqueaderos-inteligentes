import { createClient } from "@supabase/supabase-js";

// Cliente para uso en el browser (componentes Client)
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
