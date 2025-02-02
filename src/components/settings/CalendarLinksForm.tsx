import React, { useState } from 'react';
import { Twitch, Youtube, Globe2 } from 'lucide-react';

interface CalendarLinksFormProps {
  initialLinks: {
    Twitch?: string;
    YouTube?: string;
    customUrl?: string;
  };
  onSave: (links: {
    streaming_urls: { Twitch?: string; YouTube?: string };
    custom_url: string | null;
  }) => Promise<void>;
  saving?: boolean;
}

export default function CalendarLinksForm({ 
  initialLinks, 
  onSave,
  saving = false 
}: CalendarLinksFormProps) {
  const [twitchUrl, setTwitchUrl] = useState(initialLinks.Twitch || '');
  const [youtubeUrl, setYoutubeUrl] = useState(initialLinks.YouTube || '');
  const [customUrl, setCustomUrl] = useState(initialLinks.customUrl || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateUrls = () => {
    const newErrors: Record<string, string> = {};

    if (twitchUrl && !twitchUrl.match(/^https?:\/\/(www\.)?twitch\.tv\/[\w-]+$/)) {
      newErrors.twitch = 'Invalid Twitch URL format. Should be like: https://twitch.tv/username';
    }

    if (youtubeUrl && !youtubeUrl.match(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/)) {
      newErrors.youtube = 'Invalid YouTube URL format';
    }

    if (customUrl && !customUrl.match(/^https?:\/\/.+$/)) {
      newErrors.custom = 'Invalid URL format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrls()) {
      return;
    }

    const streaming_urls: { Twitch?: string; YouTube?: string } = {};
    if (twitchUrl) streaming_urls.Twitch = twitchUrl;
    if (youtubeUrl) streaming_urls.YouTube = youtubeUrl;

    await onSave({
      streaming_urls,
      custom_url: customUrl || null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Streaming Links
        </label>
        
        <div className="space-y-4">
          <div>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <Twitch className="h-4 w-4" />
              </span>
              <input
                type="url"
                value={twitchUrl}
                onChange={(e) => setTwitchUrl(e.target.value)}
                placeholder="https://twitch.tv/username"
                className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            {errors.twitch && (
              <p className="mt-1 text-sm text-red-500">{errors.twitch}</p>
            )}
          </div>

          <div>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <Youtube className="h-4 w-4" />
              </span>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/channel/..."
                className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            {errors.youtube && (
              <p className="mt-1 text-sm text-red-500">{errors.youtube}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Custom URL <span className="text-gray-500">(optional)</span>
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
            <Globe2 className="h-4 w-4" />
          </span>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        {errors.custom && (
          <p className="mt-1 text-sm text-red-500">{errors.custom}</p>
        )}
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
    </form>
  );
}