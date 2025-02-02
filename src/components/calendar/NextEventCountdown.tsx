import React from 'react';
import { differenceInDays, startOfDay } from 'date-fns';
import { Clock } from 'lucide-react';
import { CalendarEvent } from '../../types/calendar';

interface NextEventCountdownProps {
  events: CalendarEvent[];
}

export default function NextEventCountdown({ events }: NextEventCountdownProps) {
  if (!events.length) return null;

  const now = new Date();
  const nextEvent = events
    .filter(event => event.start > now)
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

  if (!nextEvent) return null;

  const eventDate = startOfDay(nextEvent.start);
  const today = startOfDay(now);
  const daysDiff = differenceInDays(eventDate, today);
  
  let message = '';
  if (daysDiff === 0) {
    message = 'Next event is today!';
  } else if (daysDiff === 1) {
    message = 'Next event is tomorrow';
  } else {
    message = `Next event in ${daysDiff} days`;
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Clock className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}