import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AddCalendarModal from '../components/AddCalendarModal';
import CalendarCard from '../components/CalendarCard';
import CombinedCalendarView from '../components/dashboard/CombinedCalendarView';
import DashboardStats from '../components/DashboardStats';
import CalendarTemplates from '../components/home/CalendarTemplates';
import TopCalendars from '../components/home/TopCalendars';
import SEO from '../components/SEO';
import { Calendar } from '../types/calendar';
import { getTopCalendars } from '../services/calendarService';

export default function Dashboard() {
  const { user } = useAuth();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [subscribedCalendars, setSubscribedCalendars] = useState<Calendar[]>([]);
  const [popularCalendars, setPopularCalendars] = useState<Calendar[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [templateData, setTemplateData] = useState<any>(null);

  // Check for template parameter on mount
  useEffect(() => {
    const templateId = searchParams.get('template');
    if (templateId && location.state?.template) {
      setTemplateData(location.state.template);
      setIsModalOpen(true);
    }
  }, [searchParams, location.state]);

  useEffect(() => {
    if (user) {
      fetchCalendars();
      fetchSubscribedCalendars();
      loadPopularCalendars();
    }
  }, [user]);

  const loadPopularCalendars = async () => {
    const calendars = await getTopCalendars();
    setPopularCalendars(calendars);
  };

  const fetchCalendars = async () => {
    if (!user) return;

    const { data: calendarsData, error } = await supabase
      .from('calendars')
      .select('*, profiles!calendars_user_id_fkey(display_name), subscriptions(count)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching calendars:', error);
      return;
    }

    const formattedCalendars = calendarsData.map(calendar => ({
      ...calendar,
      subscriber_count: calendar.subscriptions?.[0]?.count || 0
    }));

    setCalendars(formattedCalendars);
    setTotalSubscribers(formattedCalendars.reduce((acc, cal) => acc + (cal.subscriber_count || 0), 0));
  };

  const fetchSubscribedCalendars = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('calendar:calendar_id(*, profiles!calendars_user_id_fkey(display_name))')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching subscribed calendars:', error);
      return;
    }

    setSubscribedCalendars(data.map(sub => sub.calendar));
  };

  const handleTemplateSelect = (template: any) => {
    setTemplateData(template);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Your Calendars" 
        description="Manage your shared calendars and view subscriber statistics."
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats */}
        <DashboardStats totalSubscribers={totalSubscribers} totalCalendars={calendars.length} />

        {/* My Calendars */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Calendars</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 whitespace-nowrap"
            >
              Add Calendar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {calendars.map((calendar) => (
              <CalendarCard
                key={calendar.id}
                calendar={calendar}
                onUpdate={fetchCalendars}
              />
            ))}
          </div>
        </div>

        {/* Subscribed Calendars */}
        {subscribedCalendars.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Subscriptions</h2>
            <CombinedCalendarView 
              calendars={subscribedCalendars}
              onUnsubscribe={fetchSubscribedCalendars}
            />
          </div>
        )}

        {/* Calendar Templates */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Templates</h2>
          <CalendarTemplates onTemplateSelect={handleTemplateSelect} />
        </div>

        {/* Popular Calendars */}
        {popularCalendars.length > 0 && (
          <div>
            <TopCalendars calendars={popularCalendars} />
          </div>
        )}
      </main>

      <AddCalendarModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTemplateData(null);
        }}
        onAdd={fetchCalendars}
        template={templateData}
      />
    </div>
  );
}