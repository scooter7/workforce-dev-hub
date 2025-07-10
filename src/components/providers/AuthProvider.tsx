'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type User, type SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseProvider';

// Reusable function to fetch the user profile
async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

type ProfileType = Awaited<ReturnType<typeof getProfile>>;

// The signOut function is removed from the context type.
interface AuthContextType {
  user: User | null;
  profile: ProfileType | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    // Load initial session & profile
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        const userProfile = await getProfile(supabase, session.user.id);
        setProfile(userProfile);
      }
      setLoading(false);
    };
    loadSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);

        if (session?.user) {
          const userProfile = await getProfile(supabase, session.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  // The context value no longer includes signOut.
  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};