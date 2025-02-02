import React, { useState } from 'react';
import { HelpCircle, Calendar, Link as LinkIcon, Globe, ChevronRight, Users, Lock } from 'lucide-react';
import GoogleCalendarHelp from './GoogleCalendarHelp';

const faqs = [
  {
    question: 'How do I create and share a calendar?',
    steps: [
      {
        title: 'Create a Google Calendar',
        description: 'Go to calendar.google.com and create a new calendar for your events',
        link: 'https://calendar.google.com/calendar/u/0/r/settings/createcalendar',
        linkText: 'Create Calendar',
        icon: Calendar
      },
      {
        title: 'Make it Public',
        description: 'In calendar settings, select "Make available to public" to allow others to view your events',
        icon: Globe
      },
      {
        title: 'Copy Calendar URL',
        description: (
          <div className="space-y-2">
            <p>Copy the secret address in iCal URL format</p>
            <button
              type="button"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Show me the link
            </button>
          </div>
        ),
        icon: LinkIcon,
        showHelp: true
      },
      {
        title: 'Add to Calenlist',
        description: 'Create a new calendar on Calenlist and paste your Google Calendar URL',
        icon: ChevronRight
      }
    ]
  },
  {
    question: 'How do I share a private calendar with family and friends?',
    steps: [
      {
        title: 'Create Your Calendar',
        description: 'When adding your calendar to Calenlist, select "Private" instead of "Public"',
        icon: Lock
      },
      {
        title: 'Share the Link',
        description: 'Copy your calendar\'s unique URL and share it only with people you want to have access',
        icon: LinkIcon
      },
      {
        title: 'Subscriber Access',
        description: 'Only people with the link can subscribe to your calendar and see your events',
        icon: Users
      }
    ]
  },
  {
    question: 'What\'s the difference between Public and Private calendars?',
    answer: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Public Calendars:</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Visible to everyone on Calenlist</li>
            <li>Appear in search results and category listings</li>
            <li>Anyone can subscribe and view events</li>
            <li>Great for community events, public schedules, and content creators</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-2">Private Calendars:</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Only accessible via direct link</li>
            <li>Don't appear in public listings or search results</li>
            <li>Perfect for family schedules, private groups, or team events</li>
            <li>Subscribers still need a Calenlist account for features like notifications</li>
          </ul>
        </div>
      </div>
    )
  }
];

export default function FAQ() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <HelpCircle className="h-8 w-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get answers to common questions about using Calenlist
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-purple-100 overflow-hidden">
              <h3 className="text-xl font-semibold text-gray-900 p-6 bg-purple-50">
                {faq.question}
              </h3>
              
              <div className="p-6">
                {faq.steps ? (
                  <div className="space-y-8">
                    {faq.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <step.icon className="w-4 h-4 text-purple-600" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {step.title}
                          </h4>
                          <div 
                            className="text-gray-600"
                            onClick={() => step.showHelp && setShowHelp(true)}
                          >
                            {step.description}
                          </div>
                          {step.link && (
                            <a
                              href={step.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center mt-2 text-purple-600 hover:text-purple-700"
                            >
                              <span>{step.linkText}</span>
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-600">{faq.answer}</div>
                )}
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