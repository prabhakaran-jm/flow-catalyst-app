import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabaseClient } from '@/src/lib/supabaseClient';

interface SupabaseContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | null }>;
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
   * Sign in with email using Magic Link (OTP)
   * @param email - User's email address
   * @returns Promise with error if sign-in fails
   */
  const signInWithOtp = async (email: string): Promise<{ error: AuthError | null }> => {
    // Determine redirect URL based on platform
    let redirectUrl: string;
    
    if (Platform.OS === 'web') {
      // For web, use the current origin (works with any port Expo assigns)
      if (typeof window !== 'undefined' && window.location) {
        redirectUrl = `${window.location.origin}/auth/callback`;
      } else {
        // Fallback for local development - use port 8081 (common Expo web port)
        redirectUrl = 'http://127.0.0.1:8081/auth/callback';
      }
    } else {
      // Use deep link for mobile apps (iOS/Android)
      redirectUrl = 'flowcatalyst://auth/callback';
    }
    
    console.log('Sending magic link with redirect URL:', redirectUrl);
    
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('Supabase signInWithOtp error:', error);
      } else {
        console.log('Magic link sent successfully');
      }

      return { error };
    } catch (err) {
      console.error('Exception in signInWithOtp:', err);
      // Return error in the expected format
      return { 
        error: err instanceof Error 
          ? { message: err.message, name: err.name } as AuthError
          : { message: String(err), name: 'UnknownError' } as AuthError
      };
    }
  };

  /**
   * Verify OTP code from magic link email.
   * Use this when the magic link opens in a browser (e.g. emulator dev) and can't deep-link back.
   * The 6-digit code is shown in the email as "Alternatively, enter the code: XXXXXX"
   */
  const verifyOtp = async (email: string, token: string): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabaseClient.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: 'email',
      });
      return { error };
    } catch (err) {
      console.error('Exception in verifyOtp:', err);
      return {
        error: err instanceof Error
          ? { message: err.message, name: err.name } as AuthError
          : { message: String(err), name: 'UnknownError' } as AuthError,
      };
    }
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
    verifyOtp,
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
