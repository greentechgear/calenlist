import React from 'react';
import { Mail, Users, BarChart3, Calendar, MessageSquare, BarChart as ChartBar } from 'lucide-react';

const features = [
  {
    icon: Mail,
    title: "Meet in Calendars, Not Feeds",
    description: "Tired of fighting algorithms? Your events show up in people's calendars, not buried under cat videos and vacation photos."
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Track subscriber growth and get insights into your audience. Monitor subscriber counts and engagement over time."
  },
  {
    icon: MessageSquare,
    title: "Event Feedback",
    description: "Collect valuable feedback from attendees after each event. Get ratings and comments to improve future events."
  },
  {
    icon: Calendar,
    title: "Free & Open Source",
    description: "Calenlist is completely free and open source. Host your own instance or use our hosted version."
  }
];

export default function MarketingSection() {
  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Why Choose Calenlist?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Because real connections happen in calendars, not feeds. Launch events that people actually see, track engagement, and build your community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {features.map((feature) => (
            <div 
              key={feature.title} 
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
              <div className="relative bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-6">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Showcase */}
        <div className="mt-16 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <ChartBar className="h-8 w-8 text-purple-600 mr-3" />
            <h3 className="text-2xl font-bold text-gray-900">
              Powerful Analytics & Feedback
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto text-center">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900">Subscriber Stats</h4>
              <p className="text-gray-600 text-sm mt-2">Track your audience growth and engagement over time</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900">Event Feedback</h4>
              <p className="text-gray-600 text-sm mt-2">Collect ratings and comments from event attendees</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-900">Engagement Reports</h4>
              <p className="text-gray-600 text-sm mt-2">See which events resonate most with your audience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}