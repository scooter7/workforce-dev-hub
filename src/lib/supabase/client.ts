import { createBrowserClient } from '@supabase/ssr'

import { Database } from '../../types/db'

export const createSupabaseBrowserClient = () => {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export const supabase = createSupabaseBrowserClient();