import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import EventChiclet from './EventChiclet';
import { Calendar, AlertCircle } from 'lucide-react';

interface CalendarGridProps {
  googleCalendarUrl: string;
  isSubscribed: boolean;
  calendarId: string;
}

export default function CalendarGrid({ googleCalendarUrl, isSubscribed, calendarId }: CalendarGridProps) {
  const { events, loading, error } = useGoogleCalendar(googleCalendarUrl);
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });

  // Define weekdays starting with Monday
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 border-b border-purple-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(today, 'MMMM yyyy')}
        </h2>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
          {error.includes('CORS proxy') && (
            <a 
              href="https://cors-anywhere.herokuapp.com/corsdemo"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center text-sm text-red-600 hover:text-red-700 underline"
            >
              Click here to enable the CORS proxy
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-7">
        {weekdays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 border-b border-purple-100"
          >
            {day}
          </div>
        ))}
        {days.map((day) => {
          const dayEvents = events.filter(event => {
            const eventStart = new Date(event.start);
            return isSameDay(eventStart, day);
          });

          const isToday = isSameDay(day, today);

          // Calculate the day of week (0-6, where 0 is Monday)
          const dayOfWeek = (day.getDay() + 6) % 7;

          return (
            <div
              key={day.toISOString()}
              style={{ gridColumnStart: dayOfWeek + 1 }}
              className={`min-h-[100px] p-2 border-b border-r border-purple-100 transition-colors ${
                dayEvents.length > 0 ? 'hover:bg-purple-50' : ''
              } ${isToday ? 'bg-purple-50/30' : ''}`}
            >
              <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={`block text-sm font-medium mb-1 ${
                  isToday
                    ? 'text-purple-600'
                    : 'text-gray-900'
                }`}
              >
                {format(day, 'd')}
              </time>
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <EventChiclet
                    key={event.id}
                    event={event}
                    showLocation={isSubscribed}
                    calendarId={calendarId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {loading ? (
        <div className="p-4 text-center text-gray-500 border-t border-purple-100">
          Loading events...
        </div>
      ) : events.length === 0 && !error && (
        <div className="p-8 text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No events found for this month.</p>
          {!googleCalendarUrl && (
            <p className="mt-1 text-sm text-gray-400">
              Calendar URL needs to be configured.
            </p>
          )}
        </div>
      )}
    </div>
  );
}