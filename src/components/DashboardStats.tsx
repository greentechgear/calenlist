import React from 'react';
import { Users, Calendar } from 'lucide-react';

interface DashboardStatsProps {
  totalSubscribers: number;
  totalCalendars: number;
}

export default function DashboardStats({ totalSubscribers, totalCalendars }: DashboardStatsProps) {
  // Format the numbers for better display
  const formattedSubscribers = totalSubscribers.toLocaleString();
  const formattedCalendars = totalCalendars.toLocaleString();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <Users className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Total Subscribers</h3>
            <p className="text-2xl font-semibold text-purple-600">{formattedSubscribers}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Active Calendars</h3>
            <p className="text-2xl font-semibold text-purple-600">{formattedCalendars}</p>
          </div>
        </div>
      </div>
    </div>
  );
}