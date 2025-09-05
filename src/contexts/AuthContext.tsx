import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

interface AuthContextType {
  // User state
  user: User | null;
  session: Session | null;
  loading: boolean;

  // Authentication methods
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;

  // Status helpers
  isAuthenticated: boolean;
  isAnonymous: boolean;

  // Supabase client (null if disabled)
  supabase: SupabaseClient | null;
}

interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // Initialize Supabase client only if enabled
  useEffect(() => {
    const initializeSupabase = async () => {
      // Check if Supabase is enabled
      const supabaseEnabled = import.meta.env.VITE_ENABLE_SUPABASE === 'true';
      const authEnabled = import.meta.env.VITE_ENABLE_AUTHENTICATION === 'true';

      if (!supabaseEnabled || !authEnabled) {
        console.log('Supabase authentication disabled - running in anonymous-only mode');
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase configuration missing - running in anonymous-only mode');
        setLoading(false);
        return;
      }

      try {
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        });

        setSupabase(client);

        // Get initial session
        const {
          data: { session: initialSession },
        } = await client.auth.getSession();

        setSession(initialSession);
        setUser(initialSession?.user || null);

        // Listen for auth changes
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event);
          setSession(session);
          setUser(session?.user || null);
        });

        setLoading(false);

        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        setLoading(false);
      }
    };

    initializeSupabase();
  }, []);

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return {
        success: false,
        error: 'Authentication not available - Supabase not configured',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        user: data.user || undefined,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to create account. Please try again.',
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return {
        success: false,
        error: 'Authentication not available - Supabase not configured',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        user: data.user || undefined,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to sign in. Please try again.',
      };
    }
  };

  const signOut = async (): Promise<AuthResult> => {
    if (!supabase) {
      return {
        success: false,
        error: 'Authentication not available - Supabase not configured',
      };
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to sign out. Please try again.',
      };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isAnonymous: !user,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook for optional authentication features
 * Returns null values when authentication is disabled
 */
export const useOptionalAuth = () => {
  try {
    return useAuth();
  } catch {
    // Return safe defaults when AuthProvider is not available
    return {
      user: null,
      session: null,
      loading: false,
      signUp: async () => ({ success: false, error: 'Authentication not available' }),
      signIn: async () => ({ success: false, error: 'Authentication not available' }),
      signOut: async () => ({ success: false, error: 'Authentication not available' }),
      isAuthenticated: false,
      isAnonymous: true,
      supabase: null,
    };
  }
};
