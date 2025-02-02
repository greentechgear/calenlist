import React, { useState } from 'react';
import { Calendar, Copy, Bell, HelpCircle } from 'lucide-react';
import GoogleCalendarHelp from './GoogleCalendarHelp';

const steps = [
  {
    icon: Calendar,
    title: "Create a Google Calendar",
    description: (
      <div className="space-y-2">
        <p>Set up your events in Google Calendar and make it public for sharing</p>
        <a
          href="https://calendar.google.com/calendar/u/0/r/settings/createcalendar"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
        >
          <Calendar className="h-4 w-4 mr-1" />
          Create new calendar
        </a>
      </div>
    )
  },
  {
    icon: Copy,
    title: "Copy Calendar URL",
    description: (
      <div className="space-y-2">
        <p>Get your calendar's secret address from calendar.google.com</p>
        <button
          type="button"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
        >
          <HelpCircle className="h-4 w-4 mr-1" />
          Show me the link
        </button>
      </div>
    ),
    showHelp: true
  },
  {
    icon: Bell,
    title: "Share on Calenlist",
    description: "Add your calendar to Calenlist and let subscribers stay updated"
  }
];

export default function IntegrationSteps() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="bg-gradient-to-b from-purple-50 to-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Easy Google Calendar Integration
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share your Google Calendar with the world in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-1/2 w-full border-t-2 border-dashed border-purple-200" />
              )}
              
              <div className="relative flex flex-col items-center">
                <div className="absolute -top-4 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                
                <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                  <step.icon className="w-12 h-12 text-purple-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <div 
                  className="text-gray-600 text-center"
                  onClick={() => step.showHelp && setShowHelp(true)}
                >
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <GoogleCalendarHelp 
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
}