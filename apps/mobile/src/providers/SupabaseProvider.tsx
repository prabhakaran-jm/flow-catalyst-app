import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabaseClient } from '@/src/lib/supabaseClient';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

interface SupabaseProviderProps {
  children: ReactNode;
}

/**
 * Supabase Provider
 * 
 * Provides Supabase authentication state and helper methods via React Context.
 * Manages user session and auth state changes.
 */
export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get initial session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email using OTP (One-Time Password)
   * @param email - User's email address
   * @returns Promise with error if sign-in fails
   */
  const signInWithOtp = async (email: string): Promise<{ error: AuthError | null }> => {
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: {
        // You can customize email template here
        emailRedirectTo: undefined, // For mobile, typically undefined
      },
    });

    return { error };
  };

  /**
   * Sign out the current user
   * @returns Promise with error if sign-out fails
   */
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    const { error } = await supabaseClient.auth.signOut();
    return { error };
  };

  const value: SupabaseContextType = {
    user,
    session,
    loading,
    signInWithOtp,
    signOut,
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

/**
 * Hook to access Supabase context
 * @returns SupabaseContextType
 * @throws Error if used outside SupabaseProvider
 */
export function useSupabase(): SupabaseContextType {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
