import React from 'react';
import { X } from 'lucide-react';
import EventFeedbackForm from './EventFeedbackForm';

interface EventFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarId: string;
  eventId: string;
  eventTitle: string;
}

export default function EventFeedbackModal({
  isOpen,
  onClose,
  calendarId,
  eventId,
  eventTitle
}: EventFeedbackModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Event Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <EventFeedbackForm
            calendarId={calendarId}
            eventId={eventId}
            eventTitle={eventTitle}
            onSubmit={onClose}
          />
        </div>
      </div>
    </div>
  );
}