import React, { useEffect, useState } from 'react';
import { Calendar, Users, Star, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar as CalendarType } from '../types/calendar';
import CategoryBadge from '../components/CategoryBadge';
import SEO from '../components/SEO';

const useCases = [
  {
    icon: Calendar,
    title: 'Event Organizers',
    description: 'Share your event schedule with attendees and let them sync directly to their calendars.',
    examples: [
      'Conference schedules',
      'Festival lineups',
      'Workshop series'
    ]
  },
  {
    icon: Users,
    title: 'Communities',
    description: 'Keep your community informed about upcoming meetups, gatherings, and activities.',
    examples: [
      'Local meetup groups',
      'Religious organizations',
      'Sports clubs'
    ]
  },
  {
    icon: Star,
    title: 'Creators & Educators',
    description: 'Share your live streams, classes, and workshop schedules with your audience.',
    examples: [
      'Online course schedules',
      'Live streaming times',
      'Office hours'
    ]
  }
];

export default function Examples() {
  const [featuredCalendars, setFeaturedCalendars] = useState<CalendarType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCalendars();
  }, []);

  const fetchFeaturedCalendars = async () => {
    try {
      // Get top 3 calendars by subscriber count
      const { data: statsData } = await supabase
        .from('calendar_stats')
        .select('calendar_id, subscriber_count')
        .order('subscriber_count', { ascending: false })
        .limit(3);

      if (!statsData?.length) {
        setLoading(false);
        return;
      }

      const calendarIds = statsData.map(stat => stat.calendar_id);

      // Fetch the calendars with those IDs
      const { data: calendarsData } = await supabase
        .from('calendars')
        .select(`
          *,
          profiles!calendars_user_id_fkey (
            display_name
          )
        `)
        .eq('is_public', true)
        .in('id', calendarIds);

      if (calendarsData) {
        // Merge stats with calendar data
        const calendarsWithStats = calendarsData.map(calendar => {
          const stats = statsData.find(stat => stat.calendar_id === calendar.id);
          return {
            ...calendar,
            subscriber_count: stats?.subscriber_count || 0
          };
        }).sort((a, b) => (b.subscriber_count || 0) - (a.subscriber_count || 0));

        setFeaturedCalendars(calendarsWithStats);
      }
    } catch (error) {
      console.error('Error fetching featured calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Example Calendars - See Calenlist in Action" 
        description="Explore real-world examples of how organizations and creators use Calenlist to share their events and build community."
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              See Calenlist in Action
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
              Discover how organizations and creators use Calenlist to share their events and build thriving communities
            </p>
          </div>
        </div>
      </div>

      {/* Featured Examples */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto animate-pulse" />
            <p className="mt-4 text-gray-600">Loading featured calendars...</p>
          </div>
        ) : featuredCalendars.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredCalendars.map(calendar => (
              <div key={calendar.id} className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {calendar.name}
                    </h3>
                    
                    <div className="flex flex-col gap-2 mb-4">
                      {calendar.profiles?.display_name && (
                        <span className="px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-full inline-flex items-center w-fit">
                          by {calendar.profiles.display_name}
                        </span>
                      )}
                      {calendar.category_id && (
                        <CategoryBadge categoryId={calendar.category_id} size="sm" />
                      )}
                    </div>

                    {calendar.description && (
                      <p className="text-gray-600 mb-4">
                        {calendar.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Link
                        to={`/calendar/${calendar.id}`}
                        className="inline-flex items-center text-purple-600 hover:text-purple-700"
                      >
                        <span className="font-medium">View Calendar</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>

                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {calendar.subscriber_count?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-600">No featured calendars available yet.</p>
          </div>
        )}
      </div>

      {/* Use Cases */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Perfect for Every Use Case
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From small communities to large organizations, Calenlist helps you share your events effectively
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-3">
            {useCases.map(useCase => (
              <div key={useCase.title} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-6">
                  <useCase.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {useCase.description}
                </p>
                <ul className="space-y-2 text-gray-500">
                  {useCase.examples.map(example => (
                    <li key={example} className="flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 mr-2 text-purple-500" />
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Share Your Calendar?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of organizations and creators who use Calenlist to share their events and build community
            </p>
            <Link
              to="/login?signup=true"
              className="inline-flex items-center px-6 py-3 border-2 border-white rounded-lg text-lg font-medium hover:bg-white hover:text-purple-600 transition-colors"
            >
              Get Started Free
              <ExternalLink className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}