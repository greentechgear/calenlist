import React from 'react';
import { X, Calendar, Link as LinkIcon, AlertCircle } from 'lucide-react';

interface GoogleCalendarHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoogleCalendarHelp({ isOpen, onClose }: GoogleCalendarHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            How to Get Your Calendar's ICS URL
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">From Google Calendar:</h4>
                <ol className="mt-2 space-y-2 text-gray-600">
                  <li>1. Open Google Calendar</li>
                  <li>2. Find your calendar in the left sidebar</li>
                  <li>3. Click the three dots next to your calendar</li>
                  <li>4. Select "Settings and sharing"</li>
                  <li>5. Make your calendar public by checking "Make available to public"</li>
                  <li>6. Scroll to "Integrate calendar" and copy the "Secret address in iCal format"</li>
                </ol>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <LinkIcon className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Example URL format:</h4>
                <p className="mt-2 text-sm text-gray-600 break-all font-mono">
                  https://calendar.google.com/calendar/ical/[calendar-id]/private-[key]/basic.ics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}