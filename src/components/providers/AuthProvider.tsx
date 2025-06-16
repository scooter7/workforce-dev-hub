// src/components/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useSupabase } from './SupabaseProvider';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id?: string;
  full_name?: string | null;
  company?: string | null;
  role?: string | null;
  points?: number | null;
  avatar_url?: string | null; // This is the fix
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
  const supabase = useSupabase();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const getSessionAndProfile = async () => {
      setIsLoading(true);
      const { data: { session: currentSession }, error: _sessionError } = await supabase.auth.getSession();
      
      if (_sessionError) {
        console.error("AuthProvider: Error getting session initially:", _sessionError.message);
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        const currentUserId = currentSession.user.id;
        const adminEnvId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
        const isAdminUser = currentUserId === adminEnvId;
        setIsAdmin(isAdminUser);

        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('AuthProvider: Error fetching initial profile:', profileError);
        }
        setProfile(userProfile || null);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          const currentUserId = newSession.user.id;
          const adminEnvId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
          const isAdminUser = currentUserId === adminEnvId;
          setIsAdmin(isAdminUser);

          setIsLoading(true);
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('AuthProvider: Error fetching profile on auth state change:', profileError);
          }
          setProfile(userProfile || null);
          setIsLoading(false);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error.message);
    router.push('/login');
  };

  const value = { user, session, profile, isLoading, isAdmin, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};