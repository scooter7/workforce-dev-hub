// src/lib/supabase/client.ts
import { createBrowserClient as _createSupabaseBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/db'; // Your generated DB types

// Ensure your environment variables are correctly named and accessible client-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// It's common to export a function that creates the client,
// or to export a singleton instance.
// For client-side, creating it directly and exporting is usually fine.
// The createBrowserClient from @supabase/ssr is designed to be instantiated once.
export const supabase = _createSupabaseBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// Alternatively, and often recommended, wrap it in a function to ensure
// it's only created when needed or to manage a singleton more explicitly client-side.
// However, for direct export like this, the above should also work given how Next.js modules load.

/*
// If you prefer a function to get the client (can be useful for testing or specific scenarios):
let clientInstance: ReturnType<typeof _createSupabaseBrowserClient<Database>> | undefined = undefined;

export function getSupabaseBrowserClient() {
  if (clientInstance) {
    return clientInstance;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL or Anon Key is missing in client. Check your .env.local file."
    );
  }

  clientInstance = _createSupabaseBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return clientInstance;
}

// Then in your components, you would use:
// import { getSupabaseBrowserClient } from '@/lib/supabase/client';
// const supabase = getSupabaseBrowserClient();
*/