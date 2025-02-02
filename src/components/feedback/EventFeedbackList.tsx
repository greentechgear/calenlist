import React from 'react';
import { format, isAfter, isBefore, addHours } from 'date-fns';
import { CalendarEvent } from '../../types/calendar';
import EventFeedbackForm from './EventFeedbackForm';

interface EventFeedbackListProps {
  events: CalendarEvent[];
  calendarId: string;
  isSubscribed: boolean;
}

export default function EventFeedbackList({ events, calendarId, isSubscribed }: EventFeedbackListProps) {
  const now = new Date();

  // Filter events that are eligible for feedback
  const feedbackEligibleEvents = events.filter(event => {
    const eventStart = new Date(event.start);
    const feedbackEndTime = addHours(eventStart, 24);
    return isAfter(now, eventStart) && isBefore(now, feedbackEndTime);
  });

  if (!isSubscribed || feedbackEligibleEvents.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Event Feedback</h2>
        <p className="mt-1 text-sm text-gray-600">
          Share your thoughts about recent events you've attended
        </p>
      </div>
      <div className="divide-y divide-gray-200">
        {feedbackEligibleEvents.map(event => (
          <div key={event.id} className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
              <p className="text-sm text-gray-500">
                {format(event.start, 'MMMM d, yyyy h:mm a')}
              </p>
            </div>
            <EventFeedbackForm
              calendarId={calendarId}
              eventId={event.id}
              eventTitle={event.title}
            />
          </div>
        ))}
      </div>
    </div>
  );
}