import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, Globe, Lock, MoreVertical, Edit, Trash2 } from 'lucide-react';
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
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card navigation
    setShowMenu(!showMenu);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card navigation
    window.location.href = `/calendar/${calendar.id}/settings`;
  };

  return (
    <Link
      to={`/calendar/${calendar.id}`}
      className="block group relative"
    >
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

          {/* Menu Button */}
          <div className="relative">
            <button
              onClick={handleMenuClick}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Calendar options"
            >
              <MoreVertical className="h-5 w-5 text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    onClick={handleEditClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Calendar
                  </button>
                </div>
              </div>
            )}
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
          <span
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            View Calendar
          </span>
        </div>
      </div>
    </Link>
  );
}