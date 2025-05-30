'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseProvider'; // Use the Supabase client from SupabaseProvider
import { useRouter } from 'next/navigation'; // For sign out redirect

interface UserProfile {
  id?: string;
  full_name?: string | null;
  company?: string | null;
  role?: string | null;
  points?: number | null;
  // Add other profile fields you expect
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase(); // Get Supabase client from context
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) return; // Wait for supabase client to be available

    const getSessionAndProfile = async () => {
      setIsLoading(true);
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Fetch profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116: 0 rows
          console.error('Error fetching profile:', profileError);
        }
        setProfile(userProfile || null);
        setIsAdmin(currentSession.user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('AuthProvider: Auth state changed', _event, newSession?.user?.id);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setIsLoading(true); // Start loading while fetching profile
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile on auth change:', profileError);
          }
          setProfile(userProfile || null);
          setIsAdmin(newSession.user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID);
          setIsLoading(false);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false); // Ensure loading is false if no user
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    router.push('/login'); // Redirect to login after sign out
    router.refresh(); // Refresh server components
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    isAdmin,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};