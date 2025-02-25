import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Calendar, Loader, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { bannerPresets } from '../lib/banner/presets';
import { maskCalendarUrl } from '../utils/calendarUrl';
import CategorySelector from './settings/CategorySelector';
import GoogleCalendarHelp from './home/GoogleCalendarHelp';
import InviteFriendsModal from './modals/InviteFriendsModal';
import CalendarCreationSteps from './calendar/CalendarCreationSteps';
import GoogleCalendarSelector from './calendar/GoogleCalendarSelector';
import { validateCalendarForm } from '../utils/calendarValidation';
import { toast } from '../utils/toast';

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

type CalendarSource = 'new' | 'existing';

const GOOGLE_CLIENT_ID = '302687386632-bld8ojodac1nj3t8qor27vvcl3j0hpqd.apps.googleusercontent.com';
const REDIRECT_URI = `${window.location.origin}/google-callback`;

export default function AddCalendarModal({ isOpen, onClose, onAdd, template }: AddCalendarModalProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [createdCalendar, setCreatedCalendar] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calendarSource, setCalendarSource] = useState<CalendarSource>('new');
  const [selectedGoogleCalendar, setSelectedGoogleCalendar] = useState<{ id: string; summary: string } | null>(null);

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
      setGoogleCalendarUrl('');
      setIsPublic(true);
      setError('');
      setValidationErrors({});
      setCalendarSource('new');
      setSelectedGoogleCalendar(null);
    }
  }, [isOpen, template]);

  const handleGoogleAuth = async () => {
    try {
      // Store return path
      sessionStorage.setItem('calendar_return_to', location.pathname);

      // Build Google OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.append('response_type', 'token');
      authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/calendar');
      authUrl.searchParams.append('prompt', 'consent');

      // Redirect to Google auth
      window.location.href = authUrl.toString();
    } catch (err) {
      console.error('Google auth error:', err);
      toast.error('Failed to connect to Google Calendar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (calendarSource === 'new') {
      handleGoogleAuth();
      return;
    }

    // For existing calendar selection
    if (!selectedGoogleCalendar) {
      setError('Please select a calendar');
      return;
    }

    const errors = validateCalendarForm({
      name: selectedGoogleCalendar.summary,
      description,
      googleCalendarUrl: '',
      categoryId,
      demoVideoUrl: '',
      skipUrlValidation: true
    });

    setValidationErrors(errors);
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
      // Get calendar URL from Google Calendar API
      const providerToken = localStorage.getItem('google_token');
      if (!providerToken) {
        throw new Error('Google Calendar not connected');
      }

      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${selectedGoogleCalendar.id}/events?timeMin=${new Date().toISOString()}`, {
        headers: {
          'Authorization': `Bearer ${providerToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to access Google Calendar');
      }

      // Create calendar in database
      const { data: calendar, error: calendarError } = await supabase
        .from('calendars')
        .insert([
          {
            user_id: user.id,
            name: selectedGoogleCalendar.summary,
            description: description.trim() || null,
            google_calendar_url: `https://calendar.google.com/calendar/ical/${selectedGoogleCalendar.id}/public/basic.ics`,
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
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to create calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setGoogleCalendarUrl('');
    setCategoryId('');
    setIsPublic(true);
    setError('');
    setValidationErrors({});
    setCalendarSource('new');
    setSelectedGoogleCalendar(null);
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
            </div>
          )}

          <div className="mb-6">
            <div className="flex space-x-4 mb-6">
              <button
                type="button"
                onClick={() => setCalendarSource('new')}
                className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg ${
                  calendarSource === 'new'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Calendar
              </button>
              <button
                type="button"
                onClick={() => setCalendarSource('existing')}
                className={`flex-1 flex items-center justify-center px-4 py-3 border-2 rounded-lg ${
                  calendarSource === 'existing'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Use Existing Calendar
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {calendarSource === 'existing' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Google Calendar
                </label>
                <GoogleCalendarSelector
                  onSelect={calendar => {
                    setSelectedGoogleCalendar(calendar);
                    setName(calendar.summary);
                  }}
                  selectedId={selectedGoogleCalendar?.id}
                />
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Connect your Google Calendar to get started
                </p>
              </div>
            )}

            {calendarSource === 'existing' && (
              <>
                {/* Description field */}
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

                {/* Category field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category*
                  </label>
                  <CategorySelector
                    selectedId={categoryId}
                    onChange={setCategoryId}
                  />
                </div>

                {/* Visibility field */}
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
              </>
            )}

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : calendarSource === 'new' ? 'Connect Google Calendar' : 'Add Calendar'}
              </button>
            </div>
          </form>
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