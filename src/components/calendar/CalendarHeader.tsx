import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Home } from 'lucide-react';
import { Calendar as CalendarType } from '../../types/calendar';
import { useGoogleCalendarInfo } from '../../hooks/useGoogleCalendarInfo';
import CategoryBadge from '../CategoryBadge';

interface CalendarHeaderProps {
  calendar: CalendarType;
}

export default function CalendarHeader({ calendar }: CalendarHeaderProps) {
  const { name: calendarName, loading } = useGoogleCalendarInfo(calendar.google_calendar_url);

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link 
              to="/"
              className="text-gray-500 hover:text-gray-700 flex items-center"
              title="Home"
            >
              <Home className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-purple-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {loading ? 'Loading...' : calendarName || 'Calendar'} 
                </h1>
                {calendar.category_id && (
                  <div className="mt-1">
                    <CategoryBadge categoryId={calendar.category_id} size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}