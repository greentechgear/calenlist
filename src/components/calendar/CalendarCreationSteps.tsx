import React from 'react';
import { Calendar, Link as LinkIcon, ChevronRight } from 'lucide-react';

export default function CalendarCreationSteps() {
  const handleCreateCalendar = () => {
    window.open('https://calendar.google.com/calendar/u/1/r/settings/createcalendar?pli=1', '_blank');
  };

  return (
    <div className="mb-6 space-y-4 bg-purple-50 p-4 rounded-lg">
      <h3 className="font-medium text-purple-900">Quick Start Guide</h3>
      <ol className="space-y-3 text-sm text-purple-800">
        <li className="flex items-start">
          <span className="font-bold mr-2">1.</span>
          <div>
            <p>Create a new Google calendar to share</p>
            <button
              onClick={handleCreateCalendar}
              className="inline-flex items-center text-purple-600 hover:text-purple-700 mt-1 text-sm font-medium"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Open Google Calendar
            </button>
          </div>
        </li>
        <li className="flex items-start">
          <span className="font-bold mr-2">2.</span>
          <div>
            <p>Make your calendar public by checking "Make available to public"</p>
          </div>
        </li>
        <li className="flex items-start">
          <span className="font-bold mr-2">3.</span>
          <div>
            <p>Copy the "Secret address in iCal format" from calendar settings</p>
          </div>
        </li>
      </ol>
    </div>
  );
}