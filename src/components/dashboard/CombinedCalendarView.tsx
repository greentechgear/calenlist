import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
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

  // Create an array to store calendar data with events
  const calendarData: CalendarData[] = [];
  
  // Process each calendar separately
  calendars.forEach(calendar => {
    const { events = [], loading = false, error = null } = useGoogleCalendar(calendar.google_calendar_url);
    calendarData.push({
      calendarId: calendar.id,
      calendarName: calendar.name,
      creatorName: calendar.profiles?.display_name,
      banner: calendar.banner,
      events,
      loading,
      error
    });
  });

  const isLoading = calendarData.some(cal => cal.loading);
  const hasErrors = calendarData.some(cal => cal.error);

  const handleUnsubscribe = async (calendarId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('calendar_id', calendarId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Call the onUnsubscribe callback to update parent state
      onUnsubscribe(calendarId);
      toast.success('Successfully unsubscribed from calendar');
    } catch (err) {
      console.error('Error unsubscribing:', err);
      toast.error('Failed to unsubscribe from calendar');
    }
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
          {calendars.map(calendar => {
            const bannerStyle = getBannerStyle(calendar.banner);
            return (
              <div 
                key={calendar.id}
                className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
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
                  className="p-1 opacity-75 hover:opacity-100 transition-opacity"
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
                .filter(event => isSameDay(new Date(event.start), day))
                .map(event => ({
                  ...event,
                  calendarId: cal.calendarId,
                  calendarName: cal.calendarName,
                  creatorName: cal.creatorName,
                  banner: cal.banner
                }))
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