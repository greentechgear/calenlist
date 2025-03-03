import React from 'react';
import { Calendar, MapPin, BarChart3, Github } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: "Meet in Calendars, Not Feeds",
    description: "Tired of fighting algorithms? Your events show up in people's calendars, not buried under cat videos and vacation photos."
  },
  {
    icon: Github,
    title: "Free & Open Source",
    description: "Calenlist is free and open source. Host your own instance or use our hosted version and host paid events that members can subscribe to."
  },
  {
    icon: MapPin,
    title: "Location Control",
    description: "Share event locations selectively - public, subscribers-only, or private. Perfect for managing both public venues and members-only meeting spots."
  },
  {
    icon: BarChart3,
    title: "Smart Event Organization",
    description: "Organize events your way with customizable visibility settings, location sharing, and streaming links. Perfect for hybrid events that combine in-person and online attendance."
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
            Because real connections happen in calendars, not feeds. Launch events that people actually see, build your community, and keep 100% control of your audience.
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

        {/* Pricing Details */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center justify-center px-6 py-3 bg-purple-50 rounded-full">
            <span className="text-purple-700 font-medium">Free to use, with simple subscription options</span>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-center">
            <div className="p-4">
              <h4 className="font-semibold text-gray-900">Free Plan</h4>
              <p className="text-gray-600 text-sm mt-2">Create and share unlimited calendars with your audience</p>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-900">Calendar Subscriptions</h4>
              <p className="text-gray-600 text-sm mt-2">Let others subscribe to your calendars to stay updated with your events</p>
            </div>
          </div>
        </div>

        {/* Anti-Social Media Callout */}
        <div className="mt-16 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Meet People in Their Calendars, Not Their Feeds
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Remember when event planning wasn't about gaming an algorithm? 
            When RSVPs meant more than "Interested"? 
            Calenlist puts your events directly into people's calendars - 
            where they actually plan their lives, not where they mindlessly scroll.
          </p>
        </div>
      </div>
    </div>
  );
}