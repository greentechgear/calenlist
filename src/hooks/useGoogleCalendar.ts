import { useState, useEffect, useCallback } from 'react';
import { fetchGoogleCalendarEvents, CalendarEvent } from '../services/googleCalendarService';

const POLLING_INTERVAL = 60000; // Poll every minute
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds between retries

export function useGoogleCalendar(calendarUrl: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchEvents = useCallback(async (isRetry = false) => {
    if (!calendarUrl) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const calendarEvents = await fetchGoogleCalendarEvents(calendarUrl);
      setEvents(calendarEvents);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      
      // Handle retries
      if (isRetry && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchEvents(true), RETRY_DELAY);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
      }
    } finally {
      setLoading(false);
    }
  }, [calendarUrl, retryCount]);

  useEffect(() => {
    fetchEvents(true); // Initial fetch with retry enabled
    
    // Set up polling
    const intervalId = setInterval(() => {
      fetchEvents(false); // Regular polling without retries
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchEvents]);

  const refetch = useCallback(() => {
    setLoading(true);
    return fetchEvents(true);
  }, [fetchEvents]);

  return { events, loading, error, refetch };
}