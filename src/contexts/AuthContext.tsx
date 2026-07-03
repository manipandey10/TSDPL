import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';import { sendAppNotification } from '../lib/notifications';
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null; data?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data?.user) {
      await supabase.from('notifications').insert({
        user_id: data.user.id,
        title: 'Welcome back!',
        message: 'You have successfully signed in. Check your notifications for recent updates.',
        type: 'info',
        read: false,
      });

      try {
        await sendAppNotification({
          type: 'login_admin',
          user_email: data.user.email ?? '',
          user_name: (data.user.user_metadata as any)?.full_name || data.user.email || '',
          login_time: new Date().toISOString(),
        });
      } catch (notifyError) {
        console.error('Login admin notification failed:', notifyError);
      }
    }

    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const signUpOptions: { data?: Record<string, string> } = {};
    if (fullName) {
      signUpOptions.data = { full_name: fullName };
    }

    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: signUpOptions,
      });

      if (result.error) {
        console.error('Signup failed:', result.error);
      }

      return { error: result.error ?? null, data: result.data };
    } catch (err) {
      console.error('Signup threw an exception:', err);
      return {
        error: {
          message: err instanceof Error ? err.message : String(err),
        } as AuthError,
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
