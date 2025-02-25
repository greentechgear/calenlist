import React from 'react';
import { Calendar } from '../../types/calendar';
import CalendarCard from '../CalendarCard';

interface MyCalendarsProps {
  calendars: Calendar[];
  onUpdate: () => void;
}

export default function MyCalendars({ calendars, onUpdate }: MyCalendarsProps) {
  if (!calendars.length) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Calendars</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calendars.map((calendar) => (
          <CalendarCard
            key={calendar.id}
            calendar={calendar}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
}