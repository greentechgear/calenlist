import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar as CalendarType } from '../../types/calendar';
import { Twitch, Youtube, Calendar, Users, Globe2, Mail, Bell, Lock, AlertCircle, ShieldAlert } from 'lucide-react';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import NextEventCountdown from './NextEventCountdown';
import SubscriptionPrompt from '../../components/SubscriptionPrompt';
import EventFeedbackSection from './EventFeedbackSection';
import { getGoogleCalendarSubscribeUrl } from '../../utils/calendarUrl';
import { toast } from '../../utils/toast';

interface CalendarLinksProps {
  calendar: CalendarType;
  isSubscribed: boolean;
  onSubscriptionChange: () => void;
}

export default function CalendarLinks({ calendar, isSubscribed, onSubscriptionChange }: CalendarLinksProps) {
  const { user } = useAuth();
  const { events } = useGoogleCalendar(calendar.google_calendar_url);
  const [subscribing, setSubscribing] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;

    // Check email verification
    if (!user.email_confirmed_at) {
      toast.error('Please verify your email address before subscribing');
      return;
    }

    try {
      setSubscribing(true);
      const { error } = await supabase
        .from('subscriptions')
        .insert([{ user_id: user.id, calendar_id: calendar.id }]);

      if (error) throw error;

      // Open Google Calendar's "Add by URL" page
      window.open(getGoogleCalendarSubscribeUrl(calendar.google_calendar_url), '_blank');
      onSubscriptionChange();
      toast.success('Successfully subscribed to calendar');
    } catch (err) {
      console.error('Error subscribing:', err);
      toast.error('Failed to subscribe to calendar');
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('calendar_id', calendar.id);

      if (error) throw error;
      onSubscriptionChange();
      toast.success('Successfully unsubscribed from calendar');
    } catch (err) {
      console.error('Error unsubscribing:', err);
      toast.error('Failed to unsubscribe from calendar');
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    try {
      setResendingVerification(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard?email_confirmed=true`
        }
      });

      if (error) throw error;
      toast.success('Verification email sent! Please check your inbox and spam folder');
    } catch (err) {
      console.error('Error resending verification:', err);
      toast.error('Failed to resend verification email');
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Calendar Links</h3>
        <NextEventCountdown events={events} />
        {user ? (
          <>
            {!user.email_confirmed_at && !calendar.is_public && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">Private Calendar - Email Verification Required</h4>
                    <p className="mt-1 text-sm text-amber-700">
                      This is a private calendar. Email verification is required to subscribe.
                    </p>
                    <button
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className="mt-2 inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900"
                    >
                      <Mail className="h-4 w-4 mr-1.5" />
                      {resendingVerification ? 'Sending...' : 'Resend verification email'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!user.email_confirmed_at && calendar.is_public && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Email Verification Required</h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      Please verify your email address to subscribe to calendars.
                    </p>
                    <button
                      onClick={handleResendVerification}
                      disabled={resendingVerification}
                      className="mt-2 inline-flex items-center text-sm font-medium text-yellow-800 hover:text-yellow-900"
                    >
                      <Mail className="h-4 w-4 mr-1.5" />
                      {resendingVerification ? 'Sending...' : 'Resend verification email'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
              disabled={subscribing || !user.email_confirmed_at}
              className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                isSubscribed
                  ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  : user.email_confirmed_at
                  ? 'text-white bg-purple-600 hover:bg-purple-700'
                  : 'text-gray-500 bg-gray-100 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50`}
            >
              <Users className="h-4 w-4 mr-2" />
              {subscribing ? 'Processing...' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
          </>
        ) : (
          <SubscriptionPrompt calendarName={calendar.name || 'this calendar'} calendarId={calendar.id} />
        )}

        {/* Subscription Benefits */}
        {!isSubscribed && (
          <div className="mt-4 bg-purple-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-purple-900 mb-2">
              Subscribe to get:
            </h4>
            <ul className="space-y-2 text-sm text-purple-800">
              <li className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                Events synced to your calendar
              </li>
              <li className="flex items-center">
                <Bell className="h-4 w-4 mr-2 text-purple-600" />
                Updates when events change
              </li>
              {calendar.physical_address && calendar.address_visibility === 'subscribers' && (
                <li className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-purple-600" />
                  Access to event locations
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {user && isSubscribed && (
        <>
          <div className="pt-6 border-t border-gray-200">
            <div className="space-y-4">
              {calendar.streaming_urls?.Twitch && (
                <a
                  href={calendar.streaming_urls.Twitch}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-700 hover:text-purple-600"
                >
                  <Twitch className="h-5 w-5 mr-2" />
                  Watch on Twitch
                </a>
              )}
              
              {calendar.streaming_urls?.YouTube && (
                <a
                  href={calendar.streaming_urls.YouTube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-700 hover:text-purple-600"
                >
                  <Youtube className="h-5 w-5 mr-2" />
                  Watch on YouTube
                </a>
              )}

              {calendar.custom_url && (
                <a
                  href={calendar.custom_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-700 hover:text-purple-600"
                >
                  <Globe2 className="h-5 w-5 mr-2" />
                  Visit: {new URL(calendar.custom_url).hostname}
                </a>
              )}
            </div>
          </div>

          <EventFeedbackSection 
            events={events}
            calendarId={calendar.id}
          />
        </>
      )}
    </div>
  );
}