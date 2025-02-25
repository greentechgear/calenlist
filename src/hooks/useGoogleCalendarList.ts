import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  accessRole: string;
}

export function useGoogleCalendarList() {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        // Try to list calendars first
        const { data, error } = await supabase.functions.invoke('google-calendar-list');
        
        if (error) {
          // If unauthorized, trigger Google OAuth
          if (error.message.includes('unauthorized') || error.message.includes('auth')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                scopes: 'https://www.googleapis.com/auth/calendar',
                redirectTo: window.location.href
              }
            });

            if (signInError) throw signInError;
            return; // OAuth redirect will happen automatically
          }
          throw error;
        }
        
        setCalendars(data.calendars || []);
      } catch (err) {
        console.error('Error fetching Google calendars:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch calendars');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendars();
  }, []);

  return { calendars, loading, error };
}