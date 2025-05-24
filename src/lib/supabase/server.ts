import { createServerClient, type CookieOptions } from '@supabase/ssr'; // UPDATED IMPORT
import { createClient } from '@supabase/supabase-js'; // For admin client - this stays the same
import { cookies } from 'next/headers';
import { Database } from '@/types/db'; // Your generated DB types

// Environment variables for Supabase URL and Anon Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Function to create a Supabase client for Server Components
export function createSupabaseServerClient() { // Keeping your wrapper function name
  const cookieStore = cookies(); // Get the cookie store from next/headers

  // Check if essential environment variables are set
  if (!supabaseUrl) {
    throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_URL for server client.");
  }
  if (!supabaseAnonKey) {
    throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY for server client.");
  }

  return createServerClient<Database>( // Use createServerClient from @supabase/ssr
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            // console.warn(`ServerComponent: Tried to set cookie '${name}' from a Server Component. This is a no-op without revalidation. Ensure middleware handles session refresh.`);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            // console.warn(`ServerComponent: Tried to remove cookie '${name}' from a Server Component. This is a no-op without revalidation. Ensure middleware handles session refresh.`);
          }
        },
      },
    }
  );
}

// Function to create a Supabase admin client for privileged operations
export function createSupabaseAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase URL or Service Role Key is missing for admin client. Check your .env.local file."
    );
  }
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}