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
      // setIsLoading(false); // Or handle loading until supabase is available
      return; 
    }
    // console.log("AuthProvider: Supabase client is available.");

    const getSessionAndProfile = async () => {
      // console.log("AuthProvider: getSessionAndProfile called.");
      setIsLoading(true);
      // Mark sessionError as unused if you don't explicitly handle it
      const { data: { session: currentSession }, error: _sessionError } = await supabase.auth.getSession(); 
      
      // Log the session error if it exists, even if not used for flow control
      if (_sessionError) {
        console.error("AuthProvider: Error getting session initially:", _sessionError.message);
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // console.log("AuthProvider: User session found initially, fetching profile for", currentSession.user.id);
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('AuthProvider: Error fetching initial profile:', profileError);
        }
        setProfile(userProfile || null);
        setIsAdmin(currentSession.user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID);
      } else {
        // console.log("AuthProvider: No initial user session.");
        setProfile(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    };

    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log('AuthProvider: Auth state changed event:', _event, 'New session user ID:', newSession?.user?.id);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          setIsLoading(true);
          // console.log("AuthProvider: Auth state changed, fetching profile for", newSession.user.id);
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newSession.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found, which is a valid state for a new user
            console.error('AuthProvider: Error fetching profile on auth state change:', profileError);
          }
          setProfile(userProfile || null);
          setIsAdmin(newSession.user.id === process.env.NEXT_PUBLIC_ADMIN_USER_ID);
          setIsLoading(false);
        } else {
          // console.log("AuthProvider: Auth state changed, no user session.");
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]); // useEffect depends on supabase client

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error);
    }
    // State updates will be handled by onAuthStateChange listener
    // Forcing a client-side redirect and refresh
    router.push('/login'); 
    // router.refresh(); // May not be needed if onAuthStateChange handles UI updates properly
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