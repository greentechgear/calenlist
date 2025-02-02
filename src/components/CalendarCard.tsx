{/* Update CalendarCard to remove payment info */}
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Globe, Lock } from 'lucide-react';
import { getBannerStyle } from '../lib/banner/utils';
import { useCalendarCategory } from '../hooks/useCalendarCategory';

interface CalendarCardProps {
  calendar: {
    id: string;
    name: string;
    google_calendar_url: string;
    is_public: boolean;
    subscriber_count?: number;
    category_id?: string;
    profiles?: {
      display_name: string;
    };
  };
  onUpdate: () => void;
}

export default function CalendarCard({ calendar, onUpdate }: CalendarCardProps) {
  const { category } = useCalendarCategory(calendar.category_id);
  const bannerStyle = getBannerStyle(calendar.banner);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Calendar 
            className="h-8 w-8" 
            style={{ color: category?.color || '#6B7280' }}
          />
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              {calendar.name}
            </h3>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              {calendar.is_public ? (
                <Globe className="h-4 w-4 mr-1" />
              ) : (
                <Lock className="h-4 w-4 mr-1" />
              )}
              {calendar.is_public ? 'Public' : 'Private'}
              {calendar.profiles?.display_name && (
                <span className="ml-2 text-gray-400">
                  by {calendar.profiles.display_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {category && (
          <div 
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${category.color}20`,
              color: category.color
            }}
          >
            {category.name}
          </div>
        )}
        <div className="flex items-center">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            {calendar.subscriber_count || 0} subscribers
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link
          to={`/calendar/${calendar.id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          View Calendar
        </Link>
      </div>
    </div>
  );
}