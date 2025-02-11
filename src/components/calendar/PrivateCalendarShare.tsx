import React from 'react';
import { Mail, Lock } from 'lucide-react';
import { Calendar } from '../../types/calendar';

interface PrivateCalendarShareProps {
  calendar: Calendar;
  onInvite: () => void;
}

export default function PrivateCalendarShare({ calendar, onInvite }: PrivateCalendarShareProps) {
  if (calendar.is_public) {
    return null;
  }

  return (
    <div className="bg-purple-50 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
          <Lock className="h-6 w-6 text-purple-600" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-medium text-purple-900">Private Calendar</h3>
          <p className="mt-1 text-sm text-purple-700">
            Invite specific people to subscribe to this calendar by sending them an email invitation.
          </p>
          
          <div className="mt-4">
            <button
              onClick={onInvite}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email Invitation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
