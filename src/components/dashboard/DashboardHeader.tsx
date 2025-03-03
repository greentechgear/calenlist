import React from 'react';
import { Plus, Calendar, Heart, Star, Sun, Moon, Coffee, Sparkles } from 'lucide-react';

// Array of welcome icons with their colors
const welcomeIcons = [
  { icon: Heart, color: 'text-rose-600' },
  { icon: Star, color: 'text-amber-500' },
  { icon: Sun, color: 'text-orange-500' },
  { icon: Moon, color: 'text-indigo-500' },
  { icon: Coffee, color: 'text-amber-700' },
  { icon: Sparkles, color: 'text-purple-500' },
  { icon: Calendar, color: 'text-purple-600' }
];

interface DashboardHeaderProps {
  displayName: string;
  onAddCalendar: () => void;
}

export default function DashboardHeader({ displayName, onAddCalendar }: DashboardHeaderProps) {
  // Get a random icon from the array
  const randomIcon = welcomeIcons[Math.floor(Math.random() * welcomeIcons.length)];
  const Icon = randomIcon.icon;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 sm:px-8 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          {/* Welcome Message */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 sm:gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`h-8 w-8 ${randomIcon.color}`} />
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {displayName}
                </h1>
              </div>
              <p className="text-gray-600">
                Manage your calendars, track events, and stay connected with your community all in one place.
              </p>
            </div>

            {/* Action Button - Full width on mobile */}
            <button
              onClick={onAddCalendar}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span className="font-medium">New Calendar</span>
            </button>
          </div>

          {/* Quick Stats/Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
              <div className="text-sm font-medium text-purple-600 mb-1">Quick Start</div>
              <div className="text-gray-600 text-sm">
                Create a calendar to start sharing events with your community
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
              <div className="text-sm font-medium text-purple-600 mb-1">Sync Events</div>
              <div className="text-gray-600 text-sm">
                Connect your Google Calendar to keep everything in sync
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-purple-100">
              <div className="text-sm font-medium text-purple-600 mb-1">Get Updates</div>
              <div className="text-gray-600 text-sm">
                Subscribe to calendars to stay updated with events
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}