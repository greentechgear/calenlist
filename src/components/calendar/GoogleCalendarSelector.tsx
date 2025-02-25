import React, { useState, useEffect } from 'react';
import { Calendar, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface GoogleCalendar {
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  accessRole: string;
}

interface GoogleCalendarSelectorProps {
  onSelect: (calendar: { id: string; summary: string }) => void;
  selectedId?: string;
}

export default function GoogleCalendarSelector({ onSelect, selectedId }: GoogleCalendarSelectorProps) {
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get Google token from localStorage
      const providerToken = localStorage.getItem('google_token');
      if (!providerToken) {
        throw new Error('Google Calendar not connected');
      }

      // Call Google Calendar API
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendars');
      }

      const data = await response.json();
      setCalendars(data.items || []);
    } catch (err) {
      console.error('Error fetching calendars:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendars');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-6 w-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center p-4 bg-red-50 text-red-600 rounded-md">
        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!calendars.length) {
    return (
      <div className="text-center p-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No calendars found. Please create a Google Calendar first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {calendars.map(calendar => (
        <button
          key={calendar.id}
          type="button"
          onClick={() => onSelect(calendar)}
          className={`w-full flex items-center p-4 border-2 rounded-lg transition-colors ${
            selectedId === calendar.id
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Calendar className={`h-5 w-5 mr-3 ${
            selectedId === calendar.id ? 'text-purple-600' : 'text-gray-500'
          }`} />
          <div className="text-left">
            <h3 className={`font-medium ${
              selectedId === calendar.id ? 'text-purple-900' : 'text-gray-900'
            }`}>
              {calendar.summary}
            </h3>
            {calendar.description && (
              <p className={`text-sm mt-0.5 ${
                selectedId === calendar.id ? 'text-purple-600' : 'text-gray-500'
              }`}>
                {calendar.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}