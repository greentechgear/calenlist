import { useState, useEffect, useCallback } from 'react';
import { fetchGoogleCalendarEvents, CalendarEvent } from '../services/googleCalendarService';
import { isGoogleTokenExpired, refreshGoogleToken } from '../utils/googleAuth';

const POLLING_INTERVAL = 60000; // Poll every minute
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds between retries

export function useGoogleCalendar(calendarUrl: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const fetchEvents = useCallback(async (isRetry = false) => {
    // Prevent concurrent fetches
    if (isFetching) {
      return;
    }
    
    // Prevent fetching too frequently (at least 5 seconds between fetches)
    const now = Date.now();
    if (now - lastFetchTime < 5000 && lastFetchTime > 0) {
      return;
    }
    
    if (!calendarUrl) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setIsFetching(true);
      setError(null);
      
      // Check if Google token is expired and refresh if needed
      if (isGoogleTokenExpired()) {
        await refreshGoogleToken();
      }
      
      const calendarEvents = await fetchGoogleCalendarEvents(calendarUrl);
      setEvents(calendarEvents);
      setRetryCount(0); // Reset retry count on success
      setLastFetchTime(Date.now());
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
      setIsFetching(false);
    }
  }, [calendarUrl, retryCount, lastFetchTime, isFetching]);

  useEffect(() => {
    fetchEvents(true); // Initial fetch with retry enabled
    
    // Set up polling with a check to prevent too frequent fetches
    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastFetchTime >= POLLING_INTERVAL) {
        fetchEvents(false); // Regular polling without retries
      }
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