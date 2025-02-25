import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { toast } from '../utils/toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, calendarId?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle hash fragment for OAuth and email confirmation
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      if (!hash) return;

      try {
        // Parse hash parameters
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const providerToken = params.get('provider_token');
        const type = params.get('type');

        if (accessToken && refreshToken) {
          // Set the session
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) throw error;
          if (session?.user) {
            setUser(session.user);

            // Store provider token for Google Calendar access
            if (providerToken) {
              localStorage.setItem('google_token', providerToken);
            }

            // Handle different callback types
            if (type === 'recovery') {
              navigate('/reset-password', { replace: true });
            } else {
              // Stay on current page but clear hash
              window.history.replaceState(
                null, 
                '', 
                window.location.pathname + window.location.search
              );
              
              if (providerToken) {
                toast.success('Successfully connected with Google Calendar!');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        toast.error('Failed to complete authentication. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      setUser(session?.user ?? null);

      // Handle email confirmation
      if (event === 'SIGNED_IN' && session?.user) {
        if (!session.user.email_confirmed_at) {
          toast.info('Please check your email and spam folder to confirm your account');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, calendarId?: string) => {
    try {
      // Log initial signup attempt
      await supabase.rpc('log_signup_attempt', { 
        p_email: email,
        p_response: { attempt_started: true }
      });

      // Check if email exists
      const { data: emailCheck, error: emailError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (emailError && !emailError.message.includes('Results contain 0 rows')) {
        throw new Error('Error checking email availability');
      }

      if (emailCheck) {
        throw new Error('This email is already registered');
      }

      // Build redirect URL
      const redirectTo = new URL('/dashboard', window.location.origin);
      redirectTo.searchParams.set('email_confirmed', 'true');
      if (calendarId) {
        redirectTo.searchParams.set('calendar_id', calendarId);
      }

      // Proceed with signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim()
          },
          emailRedirectTo: redirectTo.toString()
        }
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error('Signup failed');

      // Call signup notification edge function
      try {
        const { error: notifyError } = await supabase.functions.invoke('signup-notification', {
          body: { 
            record: {
              id: authData.user.id,
              email: authData.user.email,
              created_at: new Date().toISOString()
            }
          }
        });

        if (notifyError) {
          console.error('Error sending signup notification:', notifyError);
        }
      } catch (notifyErr) {
        console.error('Failed to send signup notification:', notifyErr);
      }

      // Log successful signup
      await supabase.rpc('log_signup_attempt', {
        p_email: email,
        p_user_id: authData.user.id,
        p_response: { signup_successful: true }
      });

      // Set the user immediately after signup
      setUser(authData.user);

      // Show confirmation message
      toast.success('Please check your email and spam folder to confirm your account');

      // Redirect based on calendarId
      if (calendarId) {
        navigate(`/calendar/${calendarId}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);

      // Log failed signup attempt
      try {
        await supabase.rpc('log_signup_attempt', {
          p_email: email,
          p_error: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        console.error('Error logging signup failure:', logError);
      }

      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes('unique constraint') || 
            error.message.includes('already registered')) {
          throw new Error('This email is already registered');
        } else if (error.message.includes('rate limit')) {
          throw new Error('Too many signup attempts. Please try again later');
        }
        throw error;
      }
      throw new Error('An error occurred during signup');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      setUser(data.user);

      // Check email confirmation status
      if (!data.user.email_confirmed_at) {
        toast.info('Please check your email and spam folder to confirm your account');
      }
    } catch (error) {
      console.error('Signin error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address first');
        } else if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }
      throw new Error('An error occurred during sign in');
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      localStorage.removeItem('google_token'); // Clear Google token
      
      // Only redirect to home if we're on a protected route
      const protectedRoutes = ['/dashboard'];
      if (protectedRoutes.some(route => location.pathname.startsWith(route))) {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async () => {
    if (!user?.email) return;

    try {
      const redirectTo = new URL('/dashboard', window.location.origin);
      redirectTo.searchParams.set('email_confirmed', 'true');

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: redirectTo.toString()
        }
      });

      if (error) throw error;
      toast.success('Verification email sent! Please check your inbox and spam folder');
    } catch (error) {
      console.error('Error resending verification:', error);
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('Too many attempts. Please wait a few minutes before trying again');
        }
        throw error;
      }
      throw new Error('Failed to resend verification email');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signUp, 
      signOut,
      resendVerificationEmail 
    }}>
      {!loading && children}
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