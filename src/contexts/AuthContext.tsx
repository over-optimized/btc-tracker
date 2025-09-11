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

      console.log('🔧 Supabase initialization check:', {
        supabaseEnabled,
        authEnabled,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      });

      if (!supabaseEnabled || !authEnabled) {
        console.log('Supabase authentication disabled - running in anonymous-only mode');
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase configuration missing - running in anonymous-only mode');
        console.warn('Missing:', {
          url: !supabaseUrl,
          key: !supabaseAnonKey,
        });
        setLoading(false);
        return;
      }

      try {
        console.log('🚀 Creating Supabase client...');
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        });

        // Test connection with a simple API call
        console.log('🔍 Testing Supabase connection...');
        const { error: healthError } = await client.auth.getSession();

        if (healthError) {
          console.error('❌ Supabase connection test failed:', healthError);
        } else {
          console.log('✅ Supabase connection successful');
        }

        setSupabase(client);

        // Get initial session
        const {
          data: { session: initialSession },
        } = await client.auth.getSession();

        console.log('📱 Initial session:', initialSession ? 'Found' : 'None');
        setSession(initialSession);
        setUser(initialSession?.user || null);

        // Listen for auth changes
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((event, session) => {
          console.log('🔄 Auth state changed:', event, session ? 'with session' : 'no session');
          setSession(session);
          setUser(session?.user || null);
        });

        setLoading(false);

        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('💥 Failed to initialize Supabase client:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        setLoading(false);
      }
    };

    initializeSupabase();
  }, []);

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      console.warn('🚫 Signup attempted but Supabase not configured');
      return {
        success: false,
        error: 'Authentication not available - Supabase not configured',
      };
    }

    console.log('📝 Attempting signup for:', email);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('📧 Signup response:', {
        user: data.user ? 'Created' : 'None',
        session: data.session ? 'Active' : 'None',
        error: error ? error.message : 'None',
      });

      if (error) {
        console.error('❌ Signup error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          fullError: error,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Signup successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at ? 'Yes' : 'No',
      });

      return {
        success: true,
        user: data.user || undefined,
      };
    } catch (catchError) {
      console.error('💥 Signup catch block error:', {
        message: catchError instanceof Error ? catchError.message : 'Unknown error',
        stack: catchError instanceof Error ? catchError.stack : undefined,
        fullError: catchError,
      });
      return {
        success: false,
        error: 'Failed to create account. Please try again.',
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      console.warn('🚫 Login attempted but Supabase not configured');
      return {
        success: false,
        error: 'Authentication not available - Supabase not configured',
      };
    }

    console.log('🔑 Attempting login for:', email);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔓 Login response:', {
        user: data.user ? 'Found' : 'None',
        session: data.session ? 'Active' : 'None',
        error: error ? error.message : 'None',
      });

      if (error) {
        console.error('❌ Login error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          fullError: error,
        });
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Login successful:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at ? 'Yes' : 'No',
      });

      return {
        success: true,
        user: data.user || undefined,
      };
    } catch (catchError) {
      console.error('💥 Login catch block error:', {
        message: catchError instanceof Error ? catchError.message : 'Unknown error',
        stack: catchError instanceof Error ? catchError.stack : undefined,
        fullError: catchError,
      });
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
