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
      // console.log("AuthProvider: Supabase client not yet available.");
      return;
    }
    // console.log("AuthProvider: Supabase client is available.");

    const getSessionAndProfile = async () => {
      // console.log("AuthProvider: getSessionAndProfile called.");
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
        console.log("[AuthProvider - Initial Load] Current User ID:", currentUserId);
        console.log("[AuthProvider - Initial Load] NEXT_PUBLIC_ADMIN_USER_ID:", adminEnvId);
        
        const isAdminUser = currentUserId === adminEnvId;
        setIsAdmin(isAdminUser);
        console.log("[AuthProvider - Initial Load] isAdmin set to:", isAdminUser);

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
        console.log("[AuthProvider - Initial Load] No user session, isAdmin set to false.");
      }
      setIsLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('AuthProvider: Auth state changed event:', _event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          const currentUserId = newSession.user.id;
          const adminEnvId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
          console.log("[AuthProvider - Auth Change] Current User ID:", currentUserId);
          console.log("[AuthProvider - Auth Change] NEXT_PUBLIC_ADMIN_USER_ID:", adminEnvId);

          const isAdminUser = currentUserId === adminEnvId;
          setIsAdmin(isAdminUser);
          console.log("[AuthProvider - Auth Change] isAdmin set to:", isAdminUser);

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
          console.log("[AuthProvider - Auth Change] No new user session, isAdmin set to false.");
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
    // State updates (user, session, profile, isAdmin) will be handled by onAuthStateChange
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