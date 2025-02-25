import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from '../utils/toast';

export default function GoogleCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const hash = window.location.hash;
      if (!hash) return;

      try {
        // Parse hash parameters
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const providerToken = params.get('provider_token');

        if (accessToken) {
          // Store Google token for calendar access
          localStorage.setItem('google_token', accessToken);

          // Get return path
          const returnTo = sessionStorage.getItem('calendar_return_to') || '/dashboard';
          sessionStorage.removeItem('calendar_return_to');

          // Show success message
          toast.success('Successfully connected to Google Calendar');
          
          // Open calendar modal by adding state
          navigate(returnTo, { 
            replace: true,
            state: { openCalendarModal: true }
          });
        } else {
          throw new Error('No access token received');
        }
      } catch (error) {
        console.error('Error handling callback:', error);
        toast.error('Failed to connect to Google Calendar');
        navigate('/dashboard', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Connecting to Google Calendar...</p>
      </div>
    </div>
  );
}