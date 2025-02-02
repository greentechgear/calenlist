import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { CalendarEvent } from '../../types/calendar';
import EventFeedbackForm from '../feedback/EventFeedbackForm';
import { useAuth } from '../../contexts/AuthContext';
import { getFeedbackEligibleEvents } from '../../utils/eventFeedback';

interface EventFeedbackSectionProps {
  events: CalendarEvent[];
  calendarId: string;
}

export default function EventFeedbackSection({ events, calendarId }: EventFeedbackSectionProps) {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const feedbackEligibleEvents = getFeedbackEligibleEvents(events, user?.id);

  if (feedbackEligibleEvents.length === 0) {
    return null;
  }

  return (
    <div className="pt-6 border-t border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Event Feedback</h3>
      <div className="space-y-4">
        {feedbackEligibleEvents.map(event => (
          <div key={event.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <p className="text-sm text-gray-500">
                  Leave feedback for this event
                </p>
              </div>
              {selectedEventId !== event.id && (
                <button
                  onClick={() => setSelectedEventId(event.id)}
                  className="flex items-center text-purple-600 text-sm hover:text-purple-700"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Leave Feedback
                </button>
              )}
            </div>
            
            {selectedEventId === event.id && (
              <EventFeedbackForm
                calendarId={calendarId}
                eventId={event.id}
                onSubmit={() => setSelectedEventId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}