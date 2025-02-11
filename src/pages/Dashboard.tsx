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
import { Plus, Mail, Share2 } from 'lucide-react';
import { toast } from '../utils/toast';
import { getGoogleCalendarSubscribeUrl } from '../utils/calendarUrl';

interface CalendarInvite {
  id: string;
  calendar: Calendar;
  sender: {
    display_name: string;
  };
}

export default function Dashboard() {
  const { user } = useAuth();
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
    if (!user?.email) return;

    try {
      const { data, error } = await supabase
        .from('calendar_invites')
        .select(`
          id,
          calendar:calendar_id (
            id,
            name,
            description,
            is_public,
            banner,
            google_calendar_url,
            profiles!calendars_user_id_fkey (
              display_name
            )
          ),
          sender:sender_id (
            display_name
          )
        `)
        .eq('recipient_email', user.email)
        .is('accepted_at', null);

      if (error) throw error;
      setPendingInvites(data || []);
    } catch (err) {
      console.error('Error fetching pending invites:', err);
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
      // First try to get existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError && !fetchError.message.includes('Results contain 0 rows')) {
        throw fetchError;
      }

      if (existingProfile) {
        setDisplayName(existingProfile.display_name);
        return;
      }

      // If no profile exists, create one
      const defaultDisplayName = user.email ? user.email.split('@')[0] : `User ${user.id.slice(0, 8)}`;
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: user.id,
            email: user.email,
            display_name: defaultDisplayName
          }
        ])
        .select('display_name')
        .single();

      if (insertError) throw insertError;
      if (newProfile) {
        setDisplayName(newProfile.display_name);
      }
    } catch (err) {
      console.error('Error handling profile:', err);
      // Set a fallback display name
      setDisplayName(user.email ? user.email.split('@')[0] : 'User');
    }
  };

  const loadPopularCalendars = async () => {
    const calendars = await getTopCalendars();
    setPopularCalendars(calendars);
  };

  const fetchCalendars = async () => {
    if (!user) return;

    const { data: calendarsData, error } = await supabase
      .from('calendars')
      .select(`
        *, 
        profiles!calendars_user_id_fkey(display_name), 
        subscriptions(count)
      `)
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

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          calendar:calendar_id (
            *,
            profiles!calendars_user_id_fkey (
              display_name
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching subscribed calendars:', error);
        return;
      }

      setSubscribedCalendars(data?.map(sub => sub.calendar) || []);
    } catch (error) {
      console.error('Error fetching calendars:', error);
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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Message */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Welcome back, {displayName}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Stay updated with your subscribed calendars and manage your own calendar events all in one place.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add New Calendar
            </button>
          </div>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="h-5 w-5 text-purple-600 mr-2" />
              Calendar Invites
            </h2>
            <div className="space-y-4">
              {pendingInvites.map(invite => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{invite.calendar.name}</h3>
                    <p className="text-sm text-gray-600">
                      Shared by {invite.sender.display_name}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcceptInvite(invite.id, invite.calendar)}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                  >
                    Accept Invite & Subscribe
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Calendars</h2>
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