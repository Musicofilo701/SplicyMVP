import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const roleKey = process.env.ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    headers: {
      Authorization: `Bearer ${roleKey}`,
    },
  },
});
