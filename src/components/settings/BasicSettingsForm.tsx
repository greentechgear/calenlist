import React from 'react';
import { Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { bannerPresets } from '../../lib/banner/presets';
import { getBannerPattern } from '../../lib/banner/utils';
import CategorySelector from './CategorySelector';
import VisibilityToggle from './VisibilityToggle';

type AddressVisibility = 'public' | 'subscribers' | 'private';

interface BasicSettingsFormProps {
  name: string;
  description: string;
  googleCalendarUrl: string;
  categoryId: string;
  selectedBanner: string;
  demoVideoUrl: string;
  isPublic: boolean;
  physicalAddress: string;
  addressVisibility: AddressVisibility;
  validationErrors: Record<string, string>;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onGoogleCalendarUrlChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onBannerChange: (value: string) => void;
  onDemoVideoUrlChange: (value: string) => void;
  onIsPublicChange: (value: boolean) => void;
  onPhysicalAddressChange: (value: string) => void;
  onAddressVisibilityChange: (value: AddressVisibility) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export default function BasicSettingsForm({
  name,
  description,
  googleCalendarUrl,
  categoryId,
  selectedBanner,
  demoVideoUrl,
  isPublic,
  physicalAddress,
  addressVisibility,
  validationErrors,
  onNameChange,
  onDescriptionChange,
  onGoogleCalendarUrlChange,
  onCategoryChange,
  onBannerChange,
  onDemoVideoUrlChange,
  onIsPublicChange,
  onPhysicalAddressChange,
  onAddressVisibilityChange,
  onSubmit,
  saving
}: BasicSettingsFormProps) {
  const handleCreateCalendar = () => {
    window.open('https://calendar.google.com/calendar/u/0/r/settings/createcalendar', '_blank');
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Settings</h2>

      <div className="space-y-8">
        {/* Calendar URL field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Google Calendar URL*
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              <CalendarIcon className="h-4 w-4" />
            </span>
            <input
              type="url"
              required
              value={googleCalendarUrl}
              onChange={(e) => onGoogleCalendarUrlChange(e.target.value)}
              className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500"
              placeholder="https://calendar.google.com/..."
            />
          </div>
          {validationErrors.googleCalendarUrl && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.googleCalendarUrl}</p>
          )}
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Enter your Google Calendar's ICS URL. This is required to display your events.
            </p>
            <button
              type="button"
              onClick={handleCreateCalendar}
              className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Create new calendar
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
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            placeholder="My Calendar"
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
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
            placeholder="Brief description of your calendar"
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
              onChange={(e) => onPhysicalAddressChange(e.target.value)}
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
                  onClick={() => onAddressVisibilityChange('public')}
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
                  onClick={() => onAddressVisibilityChange('subscribers')}
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
                  onClick={() => onAddressVisibilityChange('private')}
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
            onChange={onCategoryChange}
          />
          {validationErrors.category && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.category}</p>
          )}
        </div>

        {/* Demo Video URL field */}
        <div>
          <label htmlFor="demoVideoUrl" className="block text-sm font-medium text-gray-700">
            Add a video URL to showcase your calendar
          </label>
          <input
            type="url"
            id="demoVideoUrl"
            value={demoVideoUrl}
            onChange={(e) => onDemoVideoUrlChange(e.target.value)}
            placeholder="YouTube, Vimeo, or Dailymotion URL"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Add a video URL to showcase your calendar (supports YouTube, Vimeo, and Dailymotion)
          </p>
          {validationErrors.demoVideo && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.demoVideo}</p>
          )}
        </div>

        <VisibilityToggle
          isPublic={isPublic}
          onChange={onIsPublicChange}
        />

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Banner Style</h3>
          <div className="grid grid-cols-2 gap-4">
            {bannerPresets.map((banner) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => onBannerChange(banner.id)}
                className={`relative rounded-lg p-4 flex flex-col items-center border-2 transition-all ${
                  selectedBanner === banner.id
                    ? 'border-purple-500 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-full h-24 rounded-md mb-2"
                  style={{
                    backgroundColor: banner.color,
                    backgroundImage: getBannerPattern(banner.pattern),
                    color: banner.textColor
                  }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {banner.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}