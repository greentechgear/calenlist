import React from 'react';
import { X } from 'lucide-react';

interface CalendarVideoProps {
  videoUrl: string;
  isOpen: boolean;
  onClose: () => void;
  calendarName: string;
}

export default function CalendarVideo({ videoUrl, isOpen, onClose, calendarName }: CalendarVideoProps) {
  if (!isOpen) return null;

  // Extract video ID and platform
  const getVideoInfo = (url: string): { platform: string; id: string } | null => {
    try {
      // Handle Dailymotion URLs first (before URL parsing)
      const dailymotionMatch = url.match(/(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/);
      if (dailymotionMatch && dailymotionMatch[1]) {
        return {
          platform: 'dailymotion',
          id: dailymotionMatch[1]
        };
      }

      const urlObj = new URL(url);
      
      // YouTube
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        // Handle youtu.be format
        if (urlObj.hostname.includes('youtu.be')) {
          return {
            platform: 'youtube',
            id: url.split('youtu.be/')[1].split('?')[0]
          };
        }
        // Handle youtube.com format
        return {
          platform: 'youtube',
          id: urlObj.searchParams.get('v') || ''
        };
      }
      
      // Vimeo
      if (urlObj.hostname.includes('vimeo.com')) {
        return {
          platform: 'vimeo',
          id: url.split('vimeo.com/')[1].split('?')[0]
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing video URL:', error);
      return null;
    }
  };

  const videoInfo = getVideoInfo(videoUrl);
  
  if (!videoInfo) {
    console.error('Could not parse video URL:', videoUrl);
    return null;
  }

  const getEmbedUrl = (info: { platform: string; id: string }): string => {
    switch (info.platform) {
      case 'youtube':
        return `https://www.youtube.com/embed/${info.id}?autoplay=1`;
      case 'vimeo':
        return `https://player.vimeo.com/video/${info.id}?autoplay=1`;
      case 'dailymotion':
        return `https://www.dailymotion.com/embed/video/${info.id}?autoplay=1`;
      default:
        return '';
    }
  };

  const embedUrl = getEmbedUrl(videoInfo);
  if (!embedUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{calendarName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="aspect-video">
          <iframe
            className="w-full h-full"
            src={embedUrl}
            title={calendarName}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}