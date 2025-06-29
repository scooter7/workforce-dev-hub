// src/lib/supabaseAdminClient.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or service key is not defined.');
}

// Use a named export to be consistent with the import statement
export const supabaseAdminClient = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);