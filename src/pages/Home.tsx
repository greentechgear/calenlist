import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AnimatedBackground from '../components/home/AnimatedBackground';
import MarketingSection from '../components/MarketingSection';
import IntegrationSteps from '../components/home/IntegrationSteps';
import CalendarTemplates from '../components/home/CalendarTemplates';
import CalenlistersShowcase from '../components/home/CalenlistersShowcase';
import FAQ from '../components/home/FAQ';
import { getTopCalendars } from '../services/calendarService';
import type { Calendar as CalendarType } from '../types/calendar';
import SEO from '../components/SEO';
import CategoryBadge from '../components/CategoryBadge';

export default function Home() {
  const { user } = useAuth();
  const [popularCalendars, setPopularCalendars] = useState<CalendarType[]>([]);

  useEffect(() => {
    loadPopularCalendars();
  }, []);

  const loadPopularCalendars = async () => {
    try {
      const calendars = await getTopCalendars(6); // Get top 6 calendars
      setPopularCalendars(calendars);
    } catch (error) {
      console.error('Error loading popular calendars:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Calenlist.com - Share your calendar, build your community"
        description="Follow and share calendars with your community. Never miss an event again."
      />

      <div className="relative overflow-hidden">
        <AnimatedBackground />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          <Calendar className="h-20 w-20 text-white/90 mx-auto mb-8 animate-bounce-slow" />
          <h1 className="text-4xl md:text-7xl font-bold text-white mb-8">
            <span className="block md:inline">Follow Events</span>{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-white to-white bg-clip-text text-transparent">
                That Matter to You
              </span>
              <span className="absolute -inset-x-6 -inset-y-4 bg-gradient-to-r from-purple-400 to-pink-400 blur-xl opacity-75"></span>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Subscribe to calendars from your favorite creators, communities, and organizations. 
            Get events directly in your calendar, where you actually plan your life.
          </p>
          <Link
            to={user ? "/dashboard" : "/login?signup=true"}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-purple-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all hover:scale-105 shadow-lg"
          >
            {user ? 'Go to Dashboard' : 'Start Following Events'}
          </Link>
        </div>
      </div>

      <MarketingSection />
      
      {!user && (
        <>
          <IntegrationSteps />
        </>
      )}
      
      <CalendarTemplates />

      {/* Popular Calendars Section */}
      {popularCalendars.length > 0 && (
        <div className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Popular Calendars
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Discover trending calendars from our community
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {popularCalendars.map(calendar => (
                <div key={calendar.id} className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {calendar.name}
                      </h3>
                      
                      <div className="flex flex-col gap-2 mb-4">
                        {calendar.profiles?.display_name && (
                          <span className="text-sm text-gray-500">
                            by {calendar.profiles.display_name}
                          </span>
                        )}
                        {calendar.category_id && (
                          <CategoryBadge categoryId={calendar.category_id} size="sm" />
                        )}
                      </div>

                      {calendar.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">
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

            <div className="text-center mt-12">
              <Link
                to="/examples"
                className="inline-flex items-center px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
              >
                View More Calendars
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <CalenlistersShowcase />
      <FAQ />
    </div>
  );
}