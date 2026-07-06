import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';
import { sendAppNotification } from '../lib/notifications';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null; data?: { user: User | null; session: Session | null } }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function logAuthError(context: string, error: AuthError | null, extra?: Record<string, unknown>) {
  if (!error) return;
  console.error(`[Auth] ${context} failed`, {
    message: error.message,
    status: error.status,
    code: (error as AuthError & { code?: string }).code,
    name: error.name,
    ...extra,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await ensureProfile(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureProfile(session.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Auth] fetchProfile failed', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        userId,
      });
    }

    setProfile(data);
    return data;
  };

  const ensureProfile = async (authUser: User, fullNameOverride?: string | null) => {
    if (!authUser?.id) return null;

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingProfileError) {
      console.error('[Auth] ensureProfile lookup failed', {
        message: existingProfileError.message,
        code: existingProfileError.code,
        details: existingProfileError.details,
        hint: existingProfileError.hint,
        userId: authUser.id,
      });
      return null;
    }

    if (existingProfile) {
      setProfile(existingProfile);
      return existingProfile;
    }

    const fallbackName = fullNameOverride || (authUser.user_metadata as { full_name?: string } | undefined)?.full_name || null;
    const { data: insertedProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: fallbackName,
        role: 'employee',
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.warn('[Auth] ensureProfile insert skipped because the backend rejected it', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        userId: authUser.id,
      });
      return null;
    }

    setProfile(insertedProfile);
    return insertedProfile;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      logAuthError('signIn', error);
      return { error };
    }

    if (data?.user) {
      await ensureProfile(data.user);

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
          user_name: (data.user.user_metadata as { full_name?: string })?.full_name || data.user.email || '',
          login_time: new Date().toISOString(),
        });
      } catch (notifyError) {
        console.error('[Auth] Login admin notification failed:', notifyError);
      }
    }

    return { error: null };
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

      const { data, error: signUpError } = result;

      if (signUpError) {
        const responseUserId = (data as { user?: User | null }).user?.id ?? null;
        logAuthError('signUp', signUpError, {
          email,
          responseUser: responseUserId,
        });
        return { error: signUpError, data };
      }

      const signedUpUser = data.user;
      if (!signedUpUser) {
        const noUserError = {
          message: 'Signup succeeded but no user was returned. Check email confirmation settings.',
          name: 'AuthApiError',
          status: 500,
        } as AuthError;
        console.error('[Auth] signUp missing user payload', data);
        return { error: noUserError, data };
      }

      if (data.session?.user) {
        await ensureProfile(data.session.user, fullName);
      } else {
        await fetchProfile(signedUpUser.id);
      }

      try {
        await sendAppNotification({
          type: 'new_registration',
          user_id: signedUpUser.id,
          user_email: signedUpUser.email ?? email,
          user_name: fullName || (signedUpUser.user_metadata as { full_name?: string })?.full_name || email,
          registered_at: new Date().toISOString(),
        });
      } catch (notifyError) {
        console.error('[Auth] Signup notification/email dispatch failed:', notifyError);
      }

      return { error: null, data };
    } catch (err) {
      console.error('[Auth] signUp threw an exception:', err);
      return {
        error: {
          message: err instanceof Error ? err.message : String(err),
          name: 'AuthApiError',
          status: 500,
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
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) logAuthError('resetPassword', error);
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
