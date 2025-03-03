import React, { useState } from 'react';
import { Calendar, Bell, HelpCircle } from 'lucide-react';
import GoogleCalendarHelp from './GoogleCalendarHelp';

const steps = [
  {
    icon: Calendar,
    title: "Synchronize with Google Calendar",
    description: (
      <div className="space-y-2">
        <p>Connect your Google Calendar account and select which calendars you want to share</p>
      </div>
    )
  },
  {
    icon: Bell,
    title: "Share on Calenlist",
    description: "Create or add existing calendars to Calenlist and let subscribers stay updated with your events"
  }
];

export default function IntegrationSteps() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="bg-gradient-to-b from-purple-50 to-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Easy Google Calendar Integration
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share your Google Calendar with the world in two simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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