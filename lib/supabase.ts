// One Supabase client for the browser. Schema: api/supabase_schema.sql.
// null when the env vars aren't set: the app then runs without sign-in, on localStorage only.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY && typeof window !== "undefined"
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        // Magic links come back with ?code=…, which the client swaps for a session on page load.
        auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true },
      })
    : null;

export const PHOTO_BUCKET = "wardrobe-photos";
