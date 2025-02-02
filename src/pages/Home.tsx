import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MousePointerClick, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TopCalendars from '../components/home/TopCalendars';
import AnimatedBackground from '../components/home/AnimatedBackground';
import MarketingSection from '../components/MarketingSection';
import IntegrationSteps from '../components/home/IntegrationSteps';
import CalendarTemplates from '../components/home/CalendarTemplates';
import ExampleCalendar from '../components/home/ExampleCalendar';
import CalenlistersShowcase from '../components/home/CalenlistersShowcase';
import FAQ from '../components/home/FAQ';
import { getTopCalendars } from '../services/calendarService';
import type { Calendar as CalendarType } from '../types/calendar';
import SEO from '../components/SEO';

export default function Home() {
  const { user } = useAuth();
  const [topCalendars, setTopCalendars] = useState<CalendarType[]>([]);

  useEffect(() => {
    loadTopCalendars();
  }, []);

  const loadTopCalendars = async () => {
    const calendars = await getTopCalendars();
    setTopCalendars(calendars);
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

      {/* Always show marketing features, even for logged in users */}
      <MarketingSection />
      
      {!user && (
        <>
          <IntegrationSteps />
          <ExampleCalendar />
        </>
      )}
      
      <CalendarTemplates />
      <CalenlistersShowcase />
      <FAQ />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <TopCalendars calendars={topCalendars} />
      </div>
    </div>
  );
}