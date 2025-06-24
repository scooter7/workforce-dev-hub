'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { type User, type SupabaseClient } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseProvider';
import { useRouter } from 'next/navigation';

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

// The context now includes a signOut function.
interface AuthContextType {
  user: User | null;
  profile: ProfileType | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const router = useRouter(); // For redirecting after logout
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  // Define the signOut function once here.
  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login?message=You have been logged out.');
  };

  useEffect(() => {
    if (!supabase) return;

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

  // Provide the signOut function in the context's value.
  const value = { user, profile, loading, signOut };

  return (
    <AuthContext.Provider value={value}>
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