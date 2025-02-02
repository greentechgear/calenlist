import { useState, useEffect, useCallback } from 'react';
import { fetchGoogleCalendarEvents, CalendarEvent } from '../services/googleCalendarService';

const POLLING_INTERVAL = 60000; // Poll every minute

export function useGoogleCalendar(calendarUrl: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!calendarUrl) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const calendarEvents = await fetchGoogleCalendarEvents(calendarUrl);
      setEvents(calendarEvents);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
      // Keep existing events on error to prevent flickering
    } finally {
      setLoading(false);
    }
  }, [calendarUrl]);

  useEffect(() => {
    fetchEvents();
    const intervalId = setInterval(fetchEvents, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}