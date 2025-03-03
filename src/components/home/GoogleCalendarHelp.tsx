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
            Sharing Your Calendar
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
                <h4 className="font-medium text-gray-900">Sharing Options:</h4>
                <ol className="mt-2 space-y-2 text-gray-600">
                  <li>1. <strong>Email Invitations</strong>: Send direct invitations to specific people</li>
                  <li>2. <strong>Share Link</strong>: Copy and share your calendar's unique URL</li>
                  <li>3. <strong>Public Listing</strong>: Make your calendar discoverable in the Calenlist directory</li>
                </ol>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <LinkIcon className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Privacy Controls:</h4>
                <p className="mt-2 text-gray-600">
                  You can control who sees your calendar and what information is visible:
                </p>
                <ul className="mt-2 space-y-1 text-gray-600 list-disc list-inside">
                  <li>Set calendars as public or private</li>
                  <li>Control visibility of event locations</li>
                  <li>Choose who can subscribe to your calendar</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-purple-600 mt-1" />
              <div>
                <h4 className="font-medium text-gray-900">Important Note:</h4>
                <p className="mt-2 text-gray-600">
                  Calenlist connects directly to your Google Calendar. Any changes you make in Google Calendar will automatically sync to Calenlist.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}