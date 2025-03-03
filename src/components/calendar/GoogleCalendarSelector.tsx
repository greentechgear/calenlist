import React, { useState, useEffect } from 'react';
import { Calendar, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { refreshGoogleToken } from '../../utils/googleAuth';
import { toast } from '../../utils/toast';

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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        // Check if token expired
        if (response.status === 401) {
          throw new Error('TOKEN_EXPIRED');
        }
        throw new Error('Failed to fetch calendars');
      }

      const data = await response.json();
      setCalendars(data.items || []);
    } catch (err) {
      console.error('Error fetching calendars:', err);
      
      // Handle token expiration specifically
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        setError('Your Google Calendar connection has expired. Please reconnect.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load calendars');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReconnect = async () => {
    try {
      setIsRefreshing(true);
      
      // Try to refresh the token first
      const refreshed = await refreshGoogleToken();
      
      if (refreshed) {
        // If token was refreshed successfully, try fetching calendars again
        await fetchCalendars();
        toast.success('Google Calendar reconnected successfully');
      } else {
        // If refresh failed, trigger new OAuth flow
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        const GOOGLE_CLIENT_ID = '302687386632-bld8ojodac1nj3t8qor27vvcl3j0hpqd.apps.googleusercontent.com';
        const REDIRECT_URI = `${window.location.origin}/google-callback.html`;
        
        authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.append('response_type', 'token');
        authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar');
        authUrl.searchParams.append('prompt', 'consent');
        
        // Store current path to return to
        sessionStorage.setItem('calendar_return_to', window.location.pathname);
        
        window.location.href = authUrl.toString();
      }
    } catch (err) {
      console.error('Error reconnecting to Google Calendar:', err);
      toast.error('Failed to reconnect to Google Calendar');
    } finally {
      setIsRefreshing(false);
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
      <div className="flex flex-col items-center p-6 bg-red-50 text-red-600 rounded-md">
        <AlertCircle className="h-8 w-8 mb-3 flex-shrink-0" />
        <p className="text-sm text-center mb-4">{error}</p>
        
        <button
          onClick={handleReconnect}
          disabled={isRefreshing}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {isRefreshing ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Reconnecting...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reconnect Google Calendar
            </>
          )}
        </button>
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