import React from 'react';
import { Calendar, Mail } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionPromptProps {
  calendarName: string;
  calendarId: string;
}

export default function SubscriptionPrompt({ calendarName, calendarId }: SubscriptionPromptProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, resendVerificationEmail } = useAuth();

  const handleSignUp = () => {
    const returnTo = encodeURIComponent(location.pathname);
    navigate(`/login?signup=true&returnTo=${returnTo}&calendarId=${calendarId}`);
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
    } catch (error) {
      console.error('Error resending verification:', error);
    }
  };

  // If user is logged in but email not verified, show verification prompt
  if (user && !user.email_confirmed_at) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="flex justify-center mb-4">
          <Mail className="h-12 w-12 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Verify Your Email
        </h3>
        <p className="text-gray-600 mb-6">
          Please verify your email address to subscribe to {calendarName}. Check your inbox and spam folder for the verification link.
        </p>
        <button
          onClick={handleResendVerification}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          Resend Verification Email
        </button>
      </div>
    );
  }

  // Default sign up prompt for non-logged in users
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
      <div className="flex justify-center mb-4">
        <Calendar className="h-12 w-12 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Subscribe to {calendarName}
      </h3>
      <p className="text-gray-600 mb-6">
        Create an account to subscribe and get notified about upcoming events
      </p>
      <button
        onClick={handleSignUp}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        Sign up to Subscribe
      </button>
    </div>
  );
}