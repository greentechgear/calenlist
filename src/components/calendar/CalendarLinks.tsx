{/* Update CalendarLinks to remove payment info */}
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Calendar as CalendarType } from '../../types/calendar';
import { Twitch, Youtube, Calendar, Users, Globe2, Mail } from 'lucide-react';
import { useGoogleCalendar } from '../../hooks/useGoogleCalendar';
import NextEventCountdown from './NextEventCountdown';
import SubscriptionPrompt from '../SubscriptionPrompt';
import EventFeedbackSection from './EventFeedbackSection';
import { getGoogleCalendarSubscribeUrl } from '../../utils/calendarUrl';
import { toast } from '../../utils/toast';

interface CalendarLinksProps {
  calendar: CalendarType;
  isSubscribed: boolean;
  onSubscriptionChange: () => void;
}

export default function CalendarLinks({ calendar, isSubscribed, onSubscriptionChange }: CalendarLinksProps) {
  const { user, resendVerificationEmail } = useAuth();
  const { events } = useGoogleCalendar(calendar.google_calendar_url);
  const [verifying, setVerifying] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;

    // Check email verification first
    if (!user.email_confirmed_at) {
      try {
        setVerifying(true);
        await resendVerificationEmail();
        toast.info('Please check your email and spam folder to verify your account');
      } catch (error) {
        console.error('Error sending verification email:', error);
        toast.error('Failed to send verification email. Please try again later.');
      } finally {
        setVerifying(false);
      }
      return;
    }

    try {
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Calendar Links</h3>
        <NextEventCountdown events={events} />
        {user ? (
          user.email_confirmed_at || isSubscribed ? (
            <button
              onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
              className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                isSubscribed
                  ? 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  : 'text-white bg-purple-600 hover:bg-purple-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              <Users className="h-4 w-4 mr-2" />
              {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="flex">
                  <Mail className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Email Verification Required
                    </h3>
                    <p className="mt-2 text-sm text-yellow-700">
                      Please verify your email address to subscribe to this calendar.
                      Check your inbox and spam folder for the verification link.
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSubscribe}
                disabled={verifying}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                <Mail className="h-4 w-4 mr-2" />
                {verifying ? 'Sending verification...' : 'Resend Verification Email'}
              </button>
            </div>
          )
        ) : (
          <SubscriptionPrompt calendarName={calendar.name || 'this calendar'} calendarId={calendar.id} />
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