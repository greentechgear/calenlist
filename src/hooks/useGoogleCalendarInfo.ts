import { useState, useEffect } from 'react';
import { GOOGLE_API_CONFIG } from '../config/google';
import { extractCalendarId, isValidCalendarUrl } from '../utils/calendarUrl';

interface CalendarInfo {
  name: string;
  loading: boolean;
  error: string | null;
}

export function useGoogleCalendarInfo(calendarUrl: string): CalendarInfo {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCalendarInfo() {
      if (!calendarUrl) {
        setLoading(false);
        return;
      }

      try {
        // First validate the URL
        if (!isValidCalendarUrl(calendarUrl)) {
          setName('');
          setError(null);
          setLoading(false);
          return;
        }

        const calendarId = extractCalendarId(calendarUrl);
        if (!calendarId) {
          setName('');
          setError(null);
          setLoading(false);
          return;
        }

        const encodedCalendarId = encodeURIComponent(calendarId);
        const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}?key=${GOOGLE_API_CONFIG.API_KEY}&fields=summary`;

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorData = await response.json();
          
          // Don't show error messages for auth issues since we can still display events
          if (response.status === 401 || response.status === 403) {
            if (isMounted) {
              setName('');
              setError(null);
            }
            return;
          }
          
          throw new Error('Failed to fetch calendar information');
        }

        const data = await response.json();

        if (isMounted) {
          setName(data.summary || '');
          setError(null);
        }
      } catch (err) {
        console.error('Calendar Info Error:', err);
        if (isMounted) {
          // Don't set error state for auth issues
          if (err instanceof Error && !err.message.includes('access denied')) {
            setError(err.message);
          }
          setName('');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    fetchCalendarInfo();

    return () => {
      isMounted = false;
    };
  }, [calendarUrl]);

  return { name, loading, error };
}