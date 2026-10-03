
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram configuradas."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);