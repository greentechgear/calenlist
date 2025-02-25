import React from 'react';
import { Mail } from 'lucide-react';
import { Calendar } from '../../types/calendar';

interface PendingInvitesProps {
  invites: Array<{
    id: string;
    calendar: Calendar;
    sender: {
      display_name: string | null;
    };
  }>;
  onAcceptInvite: (inviteId: string, calendar: Calendar) => void;
  onViewCalendar: (calendarId: string) => void;
}

export default function PendingInvites({ invites, onAcceptInvite, onViewCalendar }: PendingInvitesProps) {
  if (!invites.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Mail className="h-5 w-5 text-purple-600 mr-2" />
        Calendar Invites
      </h2>
      <div className="space-y-4">
        {invites.map(invite => (
          <div 
            key={invite.id}
            className="relative bg-purple-50 rounded-lg border border-purple-100 overflow-hidden group"
          >
            <div 
              className="p-4 cursor-pointer"
              onClick={() => onViewCalendar(invite.calendar.id)}
            >
              <h3 className="font-medium text-gray-900">{invite.calendar.name}</h3>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAcceptInvite(invite.id, invite.calendar);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                Accept Invite & Subscribe
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}