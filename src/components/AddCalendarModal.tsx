import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, HelpCircle, Globe, Lock, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { bannerPresets } from '../lib/banner/presets';
import { maskCalendarUrl, getCalendarUrlError } from '../utils/calendarUrl';
import CategorySelector from './settings/CategorySelector';
import GoogleCalendarHelp from './home/GoogleCalendarHelp';
import InviteFriendsModal from './modals/InviteFriendsModal';
import CalendarCreationSteps from './calendar/CalendarCreationSteps';
import { validateCalendarForm } from '../utils/calendarValidation';
import { toast } from '../utils/toast';

type AddressVisibility = 'public' | 'subscribers' | 'private';

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

export default function AddCalendarModal({ isOpen, onClose, onAdd, template }: AddCalendarModalProps) {
  const { user } = useAuth();
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
  const [skipUrlInput, setSkipUrlInput] = useState(false);
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [addressVisibility, setAddressVisibility] = useState<AddressVisibility>('subscribers');
  const [loading, setLoading] = useState(false);
  const [demoVideoUrl, setDemoVideoUrl] = useState('');

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
      setSkipUrlInput(false);
      setPhysicalAddress('');
      setAddressVisibility('subscribers');
    }
  }, [isOpen, template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check for invalid calendar URL format first
    if (googleCalendarUrl && !skipUrlInput) {
      const urlError = getCalendarUrlError(googleCalendarUrl);
      if (urlError) {
        setValidationErrors({
          ...validationErrors,
          googleCalendarUrl: urlError
        });
        return;
      }
    }

    const errors = validateCalendarForm({
      name,
      description,
      googleCalendarUrl,
      categoryId,
      demoVideoUrl,
      skipUrlValidation: skipUrlInput
    });

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Scroll to first error if needed
      const firstErrorElement = document.querySelector('[aria-invalid="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: calendar, error: calendarError } = await supabase
        .from('calendars')
        .insert([
          {
            user_id: user.id,
            name: name.trim(),
            description: description.trim() || null,
            google_calendar_url: googleCalendarUrl.trim() || null,
            is_public: isPublic,
            category_id: categoryId,
            banner: bannerPresets[0],
            physical_address: physicalAddress.trim() || null,
            address_visibility: addressVisibility,
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
    setSkipUrlInput(false);
    setPhysicalAddress('');
    setAddressVisibility('subscribers');
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

          {!skipUrlInput && (
            <div className="mb-8">
              <CalendarCreationSteps />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Calendar URL field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Calendar URL{!skipUrlInput && '*'}
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <CalendarIcon className="h-4 w-4" />
                </span>
                <input
                  type="url"
                  value={googleCalendarUrl}
                  onChange={(e) => setGoogleCalendarUrl(e.target.value)}
                  className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="https://calendar.google.com/calendar/ical/..."
                  aria-invalid={!!validationErrors.googleCalendarUrl}
                />
              </div>
              {googleCalendarUrl && (
                <p className="mt-1 text-sm text-gray-500">
                  Secured URL: {maskCalendarUrl(googleCalendarUrl)}
                </p>
              )}
              {validationErrors.googleCalendarUrl && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.googleCalendarUrl}</p>
              )}
              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  onClick={() => setShowHelp(true)}
                  className="text-sm text-purple-600 hover:text-purple-700 inline-flex items-center"
                >
                  <HelpCircle className="h-4 w-4 mr-1" />
                  How to find the URL
                </button>
                <button
                  type="button"
                  onClick={() => setSkipUrlInput(true)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Skip for now
                </button>
              </div>
            </div>

            {/* Name field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calendar Name*
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder="My Calendar"
                aria-invalid={!!validationErrors.name}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
              )}
            </div>

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
                aria-invalid={!!validationErrors.description}
              />
              <p className="mt-1 text-sm text-gray-500">
                {description.length}/200 characters
              </p>
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
              )}
            </div>

            {/* Physical Address field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Physical Address <span className="text-gray-500">(optional)</span>
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <MapPin className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="123 Main St, City, State 12345"
                />
              </div>
              {physicalAddress && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Visibility
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setAddressVisibility('public')}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        addressVisibility === 'public'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressVisibility('subscribers')}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        addressVisibility === 'subscribers'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Subscribers
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddressVisibility('private')}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        addressVisibility === 'private'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      Private
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {addressVisibility === 'public' && 'Address will be visible to everyone'}
                    {addressVisibility === 'subscribers' && 'Only subscribers can see the address'}
                    {addressVisibility === 'private' && 'Only you can see the address'}
                  </p>
                </div>
              )}
            </div>

            {/* Category field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <CategorySelector
                selectedId={categoryId}
                onChange={setCategoryId}
                error={validationErrors.categoryId}
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

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Add Calendar'}
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