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

  // Extract video ID from YouTube URL
  const getVideoId = (url: string): string => {
    try {
      // Handle youtu.be format
      if (url.includes('youtu.be/')) {
        return url.split('youtu.be/')[1].split('?')[0];
      }
      
      // Handle youtube.com format
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        return urlObj.searchParams.get('v') || '';
      }

      return '';
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      return '';
    }
  };

  const videoId = getVideoId(videoUrl);
  
  if (!videoId) {
    console.error('Could not extract video ID from URL:', videoUrl);
    return null;
  }

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
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
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