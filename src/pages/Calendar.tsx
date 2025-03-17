import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Settings, BarChart3, Users, MapPin, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { checkSubscription } from '../services/subscriptionService';
import { Calendar as CalendarType } from '../types/calendar';
import { getBannerStyle } from '../lib/banner/utils';
import CalendarGrid from '../components/calendar/CalendarGrid';
import CalendarLinks from '../components/calendar/CalendarLinks';
import CategoryBadge from '../components/CategoryBadge';
import CalendarDescription from '../components/calendar/CalendarDescription';
import CalendarVideo from '../components/calendar/CalendarVideo';
import CalendarVideoButton from '../components/calendar/CalendarVideoButton';
import PrivateCalendarShare from '../components/calendar/PrivateCalendarShare';
import ShareCalendarModal from '../components/settings/ShareCalendarModal';
import StatsModal from '../components/modals/StatsModal';
import ShareButton from '../components/ShareButton';
import SEO from '../components/SEO';

function Calendar() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [calendar, setCalendar] = useState<CalendarType | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageTitle = calendar?.name || 'Calendar';
  const pageDescription = `View and subscribe to ${pageTitle}. ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}.`;
  const bannerStyle = getBannerStyle(calendar?.banner);
  const isOwner = user?.id === calendar?.user_id;
  const showAddress = calendar?.physical_address && (
    isOwner || 
    calendar.address_visibility === 'public' ||
    (calendar.address_visibility === 'subscribers' && isSubscribed)
  );

  const shouldShowAddressTeaser = calendar?.physical_address && !showAddress && !isOwner;

  const handleAddressClick = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (id) {
      fetchCalendarData();
    }
  }, [id, user?.id]);

  const fetchCalendarData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch calendar data and subscriber count in parallel
      const [calendarResponse, statsResponse] = await Promise.all([
        supabase
          .from('calendars')
          .select('*, profiles!calendars_user_id_fkey(display_name)')
          .eq('id', id)
          .single(),
        supabase
          .from('calendar_stats')
          .select('subscriber_count')
          .eq('calendar_id', id)
          .single()
      ]);

      if (calendarResponse.error) {
        console.error('Calendar fetch error:', calendarResponse.error);
        setError('Calendar not found');
        return;
      }

      setCalendar(calendarResponse.data);
      setSubscriberCount(statsResponse.data?.subscriber_count || 0);

      if (user) {
        const subscribed = await checkSubscription(id, user.id);
        setIsSubscribed(subscribed);
      }
    } catch (err) {
      console.error('Error fetching calendar:', err);
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SEO title={pageTitle} noindex={true} />
        <div className="text-gray-600">Loading calendar...</div>
      </div>
    );
  }

  if (error || !calendar) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <SEO title="Calendar Not Found" noindex={true} />
        <div className="text-gray-600">{error || 'Calendar not found'}</div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={pageTitle}
        description={pageDescription}
        type="article"
        url={window.location.href}
        image={calendar?.banner?.image || 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&h=630&q=80'}
        isCalendarPage={true}
      />
      
      <div className="relative min-h-screen">
        <div 
          className="absolute inset-0 h-[800px]"
          style={bannerStyle}
        />
        
        <div className="relative">
          <div className="w-full px-4 sm:px-6 lg:px-8 pt-24 pb-16">
            <div className="max-w-7xl mx-auto text-center">
              <div className="flex flex-col items-center space-y-8">
                <h1 
                  className="text-6xl font-bold"
                  style={{ color: bannerStyle.color }}
                >
                  {calendar.name}
                </h1>

                <div className="space-y-6">
                  {calendar.profiles?.display_name && (
                    <p
                      className="text-xl opacity-75"
                      style={{ color: bannerStyle.color }}
                    >
                      Created by {calendar.profiles.display_name}
                    </p>
                  )}
                  {calendar.category_id && (
                    <CategoryBadge categoryId={calendar.category_id} size="lg" />
                  )}

                  <div className="flex items-center justify-center space-x-4">
                    <div 
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium bg-white/10 backdrop-blur-sm"
                      style={{ color: bannerStyle.color }}
                    >
                      <Users className="w-4 h-4" />
                      <span>{subscriberCount} subscribers</span>
                    </div>

                    <ShareButton url={window.location.href} />

                    {isOwner && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowStats(true)}
                          className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                          style={{ color: bannerStyle.color }}
                          title="View Statistics"
                        >
                          <BarChart3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigate(`/calendar/${calendar.id}/settings`)}
                          className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                          style={{ color: bannerStyle.color }}
                          title="Calendar Settings"
                        >
                          <Settings className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {calendar.description && (
                  <div className="max-w-2xl">
                    <CalendarDescription description={calendar.description} />
                  </div>
                )}

                {calendar.demo_video_url && (
                  <div className="mt-4">
                    <CalendarVideoButton 
                      onClick={() => setShowVideo(true)} 
                      color={bannerStyle.color}
                    />
                  </div>
                )}

                {showAddress ? (
                  <button
                    onClick={() => handleAddressClick(calendar.physical_address!)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-md bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                    style={{ color: bannerStyle.color }}
                    title="Open in Google Maps"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{calendar.physical_address}</span>
                  </button>
                ) : shouldShowAddressTeaser && (
                  <div 
                    className="flex items-center space-x-2 px-4 py-2 rounded-md bg-white/10 backdrop-blur-sm"
                    style={{ color: bannerStyle.color }}
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {calendar.address_visibility === 'subscribers' 
                        ? 'Subscribe to see event location'
                        : 'Location is private'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {/* Show private calendar sharing section for owners */}
            {isOwner && !calendar.is_public && (
              <PrivateCalendarShare 
                calendar={calendar}
                onInvite={() => setShowShareModal(true)}
              />
            )}

            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-purple-100">
                <div className="order-1 lg:order-2 p-6">
                  <CalendarLinks
                    calendar={calendar}
                    isSubscribed={isSubscribed}
                    onSubscriptionChange={fetchCalendarData}
                  />
                </div>
                <div className="order-2 lg:order-1 lg:col-span-2">
                  <CalendarGrid 
                    googleCalendarUrl={calendar.google_calendar_url}
                    isSubscribed={isSubscribed}
                    calendarId={calendar.id}
                    isPublic={calendar.is_public}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <StatsModal
          calendarId={calendar.id}
          isOpen={showStats}
          onClose={() => setShowStats(false)}
        />

        {calendar.demo_video_url && (
          <CalendarVideo
            videoUrl={calendar.demo_video_url}
            isOpen={showVideo}
            onClose={() => setShowVideo(false)}
            calendarName={calendar.name}
          />
        )}

        <ShareCalendarModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          calendar={calendar}
        />
      </div>
    </>
  );
}

export default Calendar;