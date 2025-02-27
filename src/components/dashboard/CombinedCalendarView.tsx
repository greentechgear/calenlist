import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, isBefore, isAfter } from 'date-fns';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import EventChiclet from '../calendar/EventChiclet';
import { Calendar as CalendarType } from '../../types/calendar';
import { getBannerStyle } from '../../lib/banner/utils';
import { Calendar, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../utils/toast';

interface CombinedCalendarViewProps {
  calendars: CalendarType[];
  onUnsubscribe: (calendarId: string) => void;
}

interface CalendarData {
  calendarId: string;
  calendarName: string;
  creatorName?: string;
  banner?: any;
  events: any[];
  loading: boolean;
  error: any;
}

export default function CombinedCalendarView({ calendars, onUnsubscribe }: CombinedCalendarViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });
  const [removedCalendarIds, setRemovedCalendarIds] = useState<Set<string>>(new Set());
  const [animatingCalendarId, setAnimatingCalendarId] = useState<string | null>(null);
  const isMounted = useRef(true);
  
  // When component unmounts, set isMounted to false to prevent state updates
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Create a filtered calendar list that excludes removed calendars
  const visibleCalendars = calendars.filter(calendar => !removedCalendarIds.has(calendar.id));
  
  // Build calendar data for visible calendars
  const calendarData = visibleCalendars.map(calendar => {
    const { events = [], loading = false, error = null } = useGoogleCalendar(calendar.google_calendar_url);
    return {
      calendarId: calendar.id,
      calendarName: calendar.name,
      creatorName: calendar.profiles?.display_name,
      banner: calendar.banner,
      events,
      loading,
      error
    };
  });

  const isLoading = calendarData.some(cal => cal.loading);
  const hasErrors = calendarData.some(cal => cal.error);

  const handleUnsubscribe = async (calendarId: string) => {
    if (!user || animatingCalendarId) return;
    
    // Start the animation
    setAnimatingCalendarId(calendarId);
    
    // Wait for animation
    setTimeout(async () => {
      // Mark calendar as removed so it doesn't render anymore
      if (isMounted.current) {
        setRemovedCalendarIds(prev => new Set([...prev, calendarId]));
        setAnimatingCalendarId(null);
      }
      
      try {
        // Make the actual API call to unsubscribe
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('calendar_id', calendarId)
          .eq('user_id', user.id);
  
        if (error) throw error;
  
        // Call parent callback to update state
        if (isMounted.current) {
          onUnsubscribe(calendarId);
          toast.success('Successfully unsubscribed from calendar');
        }
      } catch (err) {
        console.error('Error unsubscribing:', err);
        // If error, restore the calendar
        if (isMounted.current) {
          setRemovedCalendarIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(calendarId);
            return newSet;
          });
          toast.error('Failed to unsubscribe from calendar');
        }
      }
    }, 500); // Match this with the animation duration
  };

  const handleEventClick = (calendarId: string) => {
    navigate(`/calendar/${calendarId}`);
  };

  const handleCalendarClick = (calendarId: string, e: React.MouseEvent) => {
    // Prevent navigation if clicking the unsubscribe button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    navigate(`/calendar/${calendarId}`);
  };

  // Define weekdays starting with Monday
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  if (calendars.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">You haven't subscribed to any calendars yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-purple-100">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(today, 'MMMM yyyy')}
        </h2>
      </div>
      
      {hasErrors && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
          Some calendars couldn't be loaded. Please check your calendar settings.
        </div>
      )}

      <div className="p-4">
        <div className="mb-6 space-y-2">
          {visibleCalendars.map(calendar => {
            const bannerStyle = getBannerStyle(calendar.banner);
            const isAnimating = animatingCalendarId === calendar.id;
            
            return (
              <div 
                key={calendar.id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 transition-all ${
                  isAnimating ? 'animate-fly-away' : ''
                }`}
                style={{ backgroundColor: bannerStyle.backgroundColor }}
                onClick={(e) => handleCalendarClick(calendar.id, e)}
              >
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" style={{ color: bannerStyle.color }} />
                  <div>
                    <span 
                      className="text-sm font-medium"
                      style={{ color: bannerStyle.color }}
                    >
                      {calendar.name}
                    </span>
                    {calendar.profiles?.display_name && (
                      <span 
                        className="text-xs ml-1 opacity-75"
                        style={{ color: bannerStyle.color }}
                      >
                        by {calendar.profiles.display_name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnsubscribe(calendar.id);
                  }}
                  disabled={isAnimating || !!animatingCalendarId}
                  className="p-1 opacity-75 hover:opacity-100 transition-opacity disabled:opacity-50"
                  style={{ color: bannerStyle.color }}
                  title="Unsubscribe"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

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
            // Calculate the day of week (0-6, where 0 is Monday)
            const dayOfWeek = (day.getDay() + 6) % 7;

            // Combine events from all calendars for this day
            const dayEvents = calendarData.flatMap(cal => 
              cal.events
                .filter(event => {
                  const eventStart = new Date(event.start);
                  const eventEnd = new Date(event.end);
                  
                  // Check if this day falls within the event's duration
                  return isWithinInterval(day, { start: eventStart, end: eventEnd }) ||
                         isSameDay(eventStart, day) ||
                         isSameDay(eventEnd, day);
                })
                .map(event => {
                  const eventStart = new Date(event.start);
                  const eventEnd = new Date(event.end);
                  const isFirstDay = isSameDay(day, eventStart);
                  const isLastDay = isSameDay(day, eventEnd);
                  const isMiddleDay = isAfter(day, eventStart) && isBefore(day, eventEnd);

                  return {
                    ...event,
                    calendarId: cal.calendarId,
                    calendarName: cal.calendarName,
                    creatorName: cal.creatorName,
                    banner: cal.banner,
                    isFirstDay,
                    isLastDay,
                    isMiddleDay
                  };
                })
            ).sort((a, b) => a.start.getTime() - b.start.getTime());

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
                  {dayEvents.map(event => (
                    <div
                      key={`${event.calendarId}-${event.id}`}
                      className="group relative cursor-pointer"
                      onClick={() => handleEventClick(event.calendarId)}
                    >
                      <EventChiclet
                        event={event}
                        showLocation={true}
                        calendarId={event.calendarId}
                        color={getBannerStyle(event.banner).color}
                        isFirstDay={event.isFirstDay}
                        isLastDay={event.isLastDay}
                        isMiddleDay={event.isMiddleDay}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {isLoading && (
        <div className="p-4 text-center text-gray-500 border-t border-purple-100">
          Loading events...
        </div>
      )}
    </div>
  );
}