import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Globe, Lock, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { bannerPresets } from '../lib/banner/presets';
import CategorySelector from './settings/CategorySelector';
import GoogleCalendarHelp from './home/GoogleCalendarHelp';
import InviteFriendsModal from './modals/InviteFriendsModal';
import GoogleCalendarSelector from './GoogleCalendarSelector';
import { validateCalendarForm } from '../utils/calendarValidation';
import { toast } from '../utils/toast';
import { refreshGoogleToken } from '../utils/googleAuth';

interface AddCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  template?: {
    defaultName: string;
    defaultDescription: string;
    preselectedCategory: string;
  } | null;
}

const GOOGLE_CLIENT_ID = '302687386632-bld8ojodac1nj3t8qor27vvcl3j0hpqd.apps.googleusercontent.com';
const REDIRECT_URI = `${window.location.origin}/google-callback.html`;

export default function AddCalendarModal({ isOpen, onClose, onAdd, template }: AddCalendarModalProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [createdCalendar, setCreatedCalendar] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedGoogleCalendar, setSelectedGoogleCalendar] = useState<{ id: string; summary: string } | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const providerToken = localStorage.getItem('google_token');
  const isConnected = !!providerToken;

  useEffect(() => {
    if (isOpen) {
      if (template) {
        setName(template.defaultName);
        setDescription(template.defaultDescription);
        setCategoryId(template.preselectedCategory);
      } else {
        setName('');
        setDescription('');
        setCategoryId('');
      }

      setIsPublic(true);
      setError('');
      setSelectedGoogleCalendar(null);
      setIsCreatingNew(true);
    }
  }, [isOpen, template]);

  const handleGoogleAuth = async () => {
    try {
      setIsConnecting(true);
      sessionStorage.setItem('calendar_return_to', location.pathname);

      // Try to refresh token first if we have one
      if (providerToken) {
        const refreshed = await refreshGoogleToken();
        if (refreshed) {
          setIsConnecting(false);
          toast.success('Google Calendar reconnected successfully');
          return;
        }
      }

      // If no token or refresh failed, do full auth
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.append('response_type', 'token');
      authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar');
      authUrl.searchParams.append('prompt', 'consent');

      window.location.href = authUrl.toString();
    } catch (err) {
      console.error('Google auth error:', err);
      toast.error('Failed to connect to Google Calendar');
      setIsConnecting(false);
    }
  };

  const createGoogleCalendar = async () => {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: name,
          description: description,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      if (!response.ok) {
        // Check if token expired
        if (response.status === 401) {
          // Try to refresh token
          const refreshed = await refreshGoogleToken();
          if (refreshed) {
            // Retry with new token
            return createGoogleCalendar();
          }
          throw new Error('Your Google Calendar connection has expired. Please reconnect.');
        }
        throw new Error('Failed to create Google Calendar');
      }

      const calendar = await response.json();

      // Make calendar public
      const updateResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendar.id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${providerToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            selected: true,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update calendar settings');
      }

      // Make calendar public
      const sharingResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendar.id}/acl`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${providerToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role: 'reader',
            scope: {
              type: 'default'
            }
          })
        }
      );

      if (!sharingResponse.ok) {
        console.warn('Could not make calendar public automatically');
      }

      return calendar;
    } catch (err) {
      console.error('Error creating Google Calendar:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user && !isConnected) return;

    if (!isCreatingNew && !selectedGoogleCalendar) {
      setError('Please select a calendar');
      return;
    }

    if (isCreatingNew && !name) {
      setError('Please enter a calendar name');
      return;
    }

    const errors = validateCalendarForm({
      name: isCreatingNew ? name : selectedGoogleCalendar!.summary,
      description,
      googleCalendarUrl: '',
      categoryId,
      demoVideoUrl: '',
      skipUrlValidation: true
    });

    if (Object.keys(errors).length > 0) {
      const firstErrorElement = document.querySelector('[aria-invalid="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      let googleCalendar;

      if (isCreatingNew) {
        // Create new Google Calendar
        googleCalendar = await createGoogleCalendar();
      } else {
        // Use selected calendar
        googleCalendar = selectedGoogleCalendar;
      }

      // Create calendar in database
      const { data: calendar, error: calendarError } = await supabase
        .from('calendars')
        .insert([
          {
            user_id: user?.id,
            name: isCreatingNew ? name : googleCalendar!.summary,
            description: description.trim() || null,
            google_calendar_url: `https://calendar.google.com/calendar/ical/${googleCalendar!.id}/public/basic.ics`,
            is_public: isPublic,
            category_id: categoryId,
            banner: bannerPresets[0]
          },
        ])
        .select()
        .single();

      if (calendarError) throw calendarError;

      setCreatedCalendar(calendar);
      onAdd();
      resetForm();
      setShowInviteModal(true);
    } catch (err) {
      console.error('Error creating calendar:', err);
      if (err instanceof Error && err.message.includes('Google Calendar connection has expired')) {
        setError('Your Google Calendar connection has expired. Please reconnect.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to create calendar. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategoryId('');
    setIsPublic(true);
    setError('');
    setSelectedGoogleCalendar(null);
    setIsCreatingNew(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen && !showInviteModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl my-8">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add New Calendar</h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 rounded-md text-sm">
              {error}
              {error.includes('Google Calendar connection has expired') && (
                <button
                  onClick={handleGoogleAuth}
                  className="mt-2 w-full flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reconnect Google Calendar
                </button>
              )}
            </div>
          )}

          {isConnected ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className={`px-4 py-2 rounded-md ${
                    isCreatingNew
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Plus className="h-4 w-4 inline-block mr-1" />
                  Create New Calendar
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className={`px-4 py-2 rounded-md ${
                    !isCreatingNew
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Use Existing Calendar
                </button>
              </div>

              {isCreatingNew ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calendar Name*
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter calendar name"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Google Calendar
                  </label>
                  <GoogleCalendarSelector
                    onSelect={calendar => {
                      setSelectedGoogleCalendar(calendar);
                    }}
                    selectedId={selectedGoogleCalendar?.id}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Brief description of your calendar"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {description.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <CategorySelector
                  selectedId={categoryId}
                  onChange={setCategoryId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calendar Visibility
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg ${
                      isPublic
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    <span className="font-medium">Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg ${
                      !isPublic
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    <span className="font-medium">Private</span>
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {isPublic
                    ? 'Anyone can find and subscribe to this calendar'
                    : 'Only people you share the link with can subscribe'}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Calendar'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Connect your Google Calendar to get started
              </p>

              <button
                onClick={handleGoogleAuth}
                disabled={isConnecting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 inline-block animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Google Calendar'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <GoogleCalendarHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {createdCalendar && (
        <InviteFriendsModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            handleClose();
          }}
          calendar={createdCalendar}
        />
      )}
    </div>
  );
}