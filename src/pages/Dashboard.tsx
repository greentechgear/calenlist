import React, { useEffect, useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AddCalendarModal from '../components/AddCalendarModal';
import CombinedCalendarView from '../components/dashboard/CombinedCalendarView';
import DashboardStats from '../components/DashboardStats';
import CalendarTemplates from '../components/home/CalendarTemplates';
import TopCalendars from '../components/home/TopCalendars';
import SEO from '../components/SEO';
import { Calendar } from '../types/calendar';
import { toast } from '../utils/toast';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import PendingInvites from '../components/dashboard/PendingInvites';
import MyCalendars from '../components/dashboard/MyCalendars';
import { getGoogleCalendarSubscribeUrl } from '../utils/calendarUrl';

interface CalendarInvite {
  id: string;
  calendar: Calendar;
  sender: {
    display_name: string | null;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [subscribedCalendars, setSubscribedCalendars] = useState<Calendar[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CalendarInvite[]>([]);
  const [popularCalendars, setPopularCalendars] = useState<Calendar[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [templateData, setTemplateData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      Promise.all([
        fetchCalendars(),
        fetchSubscribedCalendars(),
        loadPopularCalendars(),
        fetchUserProfile(),
        fetchPendingInvites()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  const fetchPendingInvites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_pending_invites', {
          p_user_id: user.id
        });

      if (error) throw error;
      setPendingInvites(data || []);
    } catch (err) {
      console.error('Error fetching pending invites:', err);
      toast.error('Failed to load calendar invites');
    }
  };

  const handleAcceptInvite = async (inviteId: string, calendar: Calendar) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .rpc('accept_calendar_invite', {
          p_invite_id: inviteId,
          p_user_id: user.id
        });

      if (error) throw error;

      if (data) {
        // Open Google Calendar subscription window
        window.open(getGoogleCalendarSubscribeUrl(calendar.google_calendar_url), '_blank');
        
        // Refresh data
        await Promise.all([
          fetchPendingInvites(),
          fetchSubscribedCalendars()
        ]);
        toast.success('Calendar invite accepted successfully');
      } else {
        toast.error('Failed to accept invite. Please try again.');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      toast.error('Failed to accept calendar invite');
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setDisplayName(data?.display_name || user.email?.split('@')[0] || 'User');
    } catch (err) {
      console.error('Error fetching profile:', err);
      setDisplayName(user.email?.split('@')[0] || 'User');
    }
  };

  const loadPopularCalendars = async () => {
    try {
      const { data: calendarsData, error } = await supabase
        .from('calendars')
        .select(`
          *,
          profiles!calendars_user_id_fkey (
            display_name
          ),
          calendar_stats!inner (
            subscriber_count
          )
        `)
        .eq('is_public', true)
        .order('calendar_stats(subscriber_count)', { ascending: false })
        .limit(6);

      if (error) throw error;
      setPopularCalendars(calendarsData || []);
    } catch (error) {
      console.error('Error loading popular calendars:', error);
    }
  };

  const fetchCalendars = async () => {
    if (!user) return;

    try {
      const { data: calendarsData, error } = await supabase
        .from('calendars')
        .select(`
          *, 
          profiles!calendars_user_id_fkey(display_name), 
          calendar_stats!inner(subscriber_count)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      setCalendars(calendarsData || []);
      setTotalSubscribers(
        calendarsData?.reduce((acc, cal) => acc + (cal.calendar_stats?.[0]?.subscriber_count || 0), 0) || 0
      );
    } catch (err) {
      console.error('Error fetching calendars:', err);
      toast.error('Failed to load your calendars');
    }
  };

  const fetchSubscribedCalendars = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          calendar:calendars!inner (
            *,
            profiles!calendars_user_id_fkey (
              display_name
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setSubscribedCalendars(data?.map(sub => sub.calendar).filter(Boolean) || []);
    } catch (error) {
      console.error('Error fetching subscribed calendars:', error);
      toast.error('Failed to load your subscriptions');
    }
  };

  const handleTemplateSelect = (template: any) => {
    setTemplateData(template);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your calendars...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Your Calendars" 
        description="Manage your shared calendars and view subscriber statistics."
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <DashboardHeader 
          displayName={displayName}
          onAddCalendar={() => setIsModalOpen(true)}
        />

        <PendingInvites 
          invites={pendingInvites}
          onAcceptInvite={handleAcceptInvite}
          onViewCalendar={(calendarId) => navigate(`/calendar/${calendarId}`)}
        />

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

        {/* Stats - Only shown if user has calendars */}
        {calendars.length > 0 && (
          <DashboardStats totalSubscribers={totalSubscribers} totalCalendars={calendars.length} />
        )}

        {/* My Calendars */}
        <MyCalendars 
          calendars={calendars}
          onUpdate={fetchCalendars}
        />

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