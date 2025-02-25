import React from 'react';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  displayName: string;
  onAddCalendar: () => void;
}

export default function DashboardHeader({ displayName, onAddCalendar }: DashboardHeaderProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Stay updated with your subscribed calendars and manage your own calendar events all in one place.
          </p>
        </div>
        
        <button
          onClick={onAddCalendar}
          className="w-full sm:w-auto flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add New Calendar
        </button>
      </div>
    </div>
  );
}