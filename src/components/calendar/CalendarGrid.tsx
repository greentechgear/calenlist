import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, isBefore, isAfter, addMonths, subMonths } from 'date-fns';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import EventChiclet from './EventChiclet';
import { Calendar, AlertCircle, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface CalendarGridProps {
  googleCalendarUrl: string;
  isSubscribed: boolean;
  calendarId: string;
  isPublic?: boolean;
}

export default function CalendarGrid({ googleCalendarUrl, isSubscribed, calendarId, isPublic = true }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { events, loading, error } = useGoogleCalendar(googleCalendarUrl);
  const today = new Date();
  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  // Define weekdays starting with Sunday
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Only show events if calendar is public or user is subscribed
  const visibleEvents = isPublic ? events : isSubscribed ? events : [];

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 border-b border-purple-100">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900 flex-1">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center rounded-md border border-gray-200">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-l-md border-r border-gray-200 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-r-md transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
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

      {!isPublic && !isSubscribed && (
        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center space-x-2 text-amber-800">
            <Lock className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">Sign in and subscribe to view events for this private calendar</p>
          </div>
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
          // Get events that occur on this day (including multi-day events)
          const dayEvents = visibleEvents.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            // For all-day events, check if the day matches the start date
            if (event.allDay) {
              return isSameDay(day, eventStart);
            }
            
            // For timed events, check if this day falls within the event's duration
            return isWithinInterval(day, { start: eventStart, end: eventEnd }) ||
                   isSameDay(eventStart, day) ||
                   isSameDay(eventEnd, day);
          });

          // Calculate the day of week (0-6, where 0 is Sunday)
          const dayOfWeek = day.getDay();

          return (
            <div
              key={day.toISOString()}
              style={{ gridColumnStart: dayOfWeek + 1 }}
              className={`min-h-[100px] p-2 border-b border-r border-purple-100 transition-colors ${
                dayEvents.length > 0 ? 'hover:bg-purple-50' : ''
              } ${isSameDay(day, today) ? 'bg-purple-50/30' : ''}`}
            >
              <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={`block text-sm font-medium mb-1 ${
                  isSameDay(day, today)
                    ? 'text-purple-600'
                    : 'text-gray-900'
                }`}
              >
                {format(day, 'd')}
              </time>
              <div className="space-y-1">
                {dayEvents.map(event => {
                  const eventStart = new Date(event.start);
                  const eventEnd = new Date(event.end);
                  const isFirstDay = isSameDay(day, eventStart);
                  const isLastDay = isSameDay(day, eventEnd);
                  const isMiddleDay = isAfter(day, eventStart) && isBefore(day, eventEnd);

                  return (
                    <EventChiclet
                      key={event.id}
                      event={event}
                      showLocation={isSubscribed}
                      calendarId={calendarId}
                      isFirstDay={isFirstDay}
                      isLastDay={isLastDay}
                      isMiddleDay={isMiddleDay}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {loading ? (
        <div className="p-4 text-center text-gray-500 border-t border-purple-100">
          Loading events...
        </div>
      ) : visibleEvents.length === 0 && !error && (
        <div className="p-8 text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">
            {!isPublic && !isSubscribed 
              ? 'Subscribe to view events'
              : 'No events found for this month.'}
          </p>
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