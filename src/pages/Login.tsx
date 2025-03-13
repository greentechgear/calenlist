import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'true') {
      setIsSignUp(true);
    }
  }, [location]);

  const getRedirectPath = () => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    const calendarId = params.get('calendarId');
    const template = params.get('template');

    // First priority: explicit return path
    if (returnTo) {
      // Ensure returnTo starts with a slash
      return returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
    }
    
    // Second priority: calendar ID
    if (calendarId) {
      return `/calendar/${calendarId}`;
    }
    
    // Third priority: template
    if (template) {
      return `/dashboard?template=${template}`;
    }
    
    // Default fallback
    return '/dashboard';
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setResendingVerification(true);
    setError('');
    
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard?email_confirmed=true`
        }
      });

      if (resendError) throw resendError;
      
      setVerificationSent(true);
      // Reset verification sent state after 1 minute
      setTimeout(() => setVerificationSent(false), 60000);
    } catch (err) {
      if (err instanceof Error && err.message.includes('rate limit')) {
        setError('Too many verification emails sent. Please wait a few minutes before trying again.');
      } else {
        setError('Failed to resend verification email. Please try again.');
      }
    } finally {
      setResendingVerification(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      
      setVerificationSent(true);
      setError('Password reset instructions have been sent to your email');
      // Reset verification sent state after 1 minute
      setTimeout(() => setVerificationSent(false), 60000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setVerificationSent(false);
    setIsSubmitting(true);
    
    try {
      const redirectPath = getRedirectPath();

      if (isSignUp) {
        if (!displayName.trim()) {
          setError('Display name is required');
          return;
        }
        await signUp(email, password, displayName.trim());
      } else {
        await signIn(email, password);
      }
      
      // Navigate to the redirect path
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      
      if (message.toLowerCase().includes('email not confirmed')) {
        setError('Email not confirmed. Please check your inbox and spam folder, or click below to resend the verification email.');
      } else if (message.toLowerCase().includes('rate limit')) {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else if (message.toLowerCase().includes('confirmation email')) {
        setError('Unable to send confirmation email. Please try again in a few minutes.');
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <SEO 
          title="Reset Password" 
          description="Reset your password to regain access to your account"
        />

        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center">
            <div className="flex justify-center">
              <Calendar className="h-12 w-12 text-purple-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you instructions to reset your password
            </p>
          </div>

          {error && (
            <div className={`p-3 rounded-md text-sm ${
              error.includes('have been sent') 
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-600'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-purple-600 hover:text-purple-500"
              >
                Back to login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <SEO 
        title={isSignUp ? "Create Account" : "Sign In"} 
        description="Sign in or create an account to subscribe to calendars and stay updated with events"
      />

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <Calendar className="h-12 w-12 text-purple-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isSignUp ? 'Join Calenlist' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Subscribe to calendars and stay updated with events that matter to you.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
            {error}
            {error.toLowerCase().includes('email not confirmed') && (
              <button
                onClick={handleResendVerification}
                disabled={resendingVerification || verificationSent}
                className="mt-2 w-full flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                {resendingVerification 
                  ? 'Sending...' 
                  : verificationSent 
                    ? 'Verification email sent! Check inbox & spam'
                    : 'Resend verification email'}
              </button>
            )}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {!isSignUp && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-purple-600 hover:text-purple-500"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isSubmitting 
              ? (isSignUp ? 'Creating account...' : 'Signing in...') 
              : (isSignUp ? 'Create account' : 'Sign in')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-purple-600 hover:text-purple-500"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}