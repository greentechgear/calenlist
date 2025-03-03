import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Calendar, Users, Video, Briefcase, Dumbbell, GraduationCap as Graduation } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  defaultName: string;
  defaultDescription: string;
}

interface CalendarTemplatesProps {
  onTemplateSelect?: (template: {
    defaultName: string;
    defaultDescription: string;
    preselectedCategory: string;
  }) => void;
}

const templates: Template[] = [
  {
    id: 'office-hours',
    name: 'Office Hours',
    description: 'Perfect for professors, consultants, or anyone who needs to share their availability.',
    icon: Calendar,
    category: '37e3806e-d47c-4ae3-9c12-44a671dcd7c3',
    defaultName: 'My Office Hours',
    defaultDescription: 'Regular office hours and availability slots for meetings and consultations.'
  },
  {
    id: 'community',
    name: 'Community Events',
    description: 'Organize meetups, gatherings, and community activities.',
    icon: Users,
    category: 'e4d97cf3-43fb-4185-9d34-e50d7c0b8985',
    defaultName: 'Community Events',
    defaultDescription: 'Stay updated with our latest community events and activities.'
  },
  {
    id: 'webinar',
    name: 'Webinar Series',
    description: 'Share your online events, workshops, and webinars.',
    icon: Video,
    category: 'f7d97cf3-43fb-4185-9d34-e50d7c0b8985',
    defaultName: 'My Webinar Series',
    defaultDescription: 'Join our regular webinars covering various topics and insights.'
  },
  {
    id: 'consulting',
    name: 'Consulting Sessions',
    description: 'Schedule and manage your consulting appointments.',
    icon: Briefcase,
    category: '8a9d6a4f-6d77-4c5c-9de9-9e6e9520cb6a',
    defaultName: 'Consulting Calendar',
    defaultDescription: 'Book consulting sessions and view availability.'
  },
  {
    id: 'fitness',
    name: 'Fitness Classes',
    description: 'Share your workout schedule and fitness classes.',
    icon: Dumbbell,
    category: 'c2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1',
    defaultName: 'Fitness Schedule',
    defaultDescription: 'Weekly fitness classes and training sessions schedule.'
  },
  {
    id: 'workshop',
    name: 'Workshop Series',
    description: 'Organize and share your educational workshops.',
    icon: Graduation,
    category: 'c2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1',
    defaultName: 'Workshop Series',
    defaultDescription: 'Interactive workshops and training sessions calendar.'
  }
];

export default function CalendarTemplates({ onTemplateSelect }: CalendarTemplatesProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const handleTemplateSelect = (template: Template) => {
    if (!user) {
      // Preserve any existing return path
      const returnTo = searchParams.get('returnTo');
      const params = new URLSearchParams({
        signup: 'true',
        template: template.id,
        ...(returnTo && { returnTo })
      });
      navigate(`/login?${params.toString()}`);
      return;
    }

    const templateData = {
      defaultName: template.defaultName,
      defaultDescription: template.defaultDescription,
      preselectedCategory: template.category
    };

    // If we're on the dashboard and have a callback, use it
    if (location.pathname === '/dashboard' && onTemplateSelect) {
      onTemplateSelect(templateData);
      return;
    }

    // Otherwise navigate to dashboard with template data
    navigate(`/dashboard?template=${template.id}`, {
      state: { template: templateData }
    });
  };

  return (
    <div className="bg-white pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Quick Start Templates
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose a template to get started quickly with pre-configured settings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="group relative bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-left transition-all hover:shadow-md"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-0 group-hover:opacity-25 transition duration-500"></div>
              <div className="relative">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <template.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-600">
                  {template.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}