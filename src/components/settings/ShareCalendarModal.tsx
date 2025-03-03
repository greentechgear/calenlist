import React, { useState } from 'react';
import { X, Mail, Copy, Share2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Calendar } from '../../types/calendar';
import { toast } from '../../utils/toast';

interface ShareCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: Calendar;
}

export default function ShareCalendarModal({ isOpen, onClose, calendar }: ShareCalendarModalProps) {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const calendarUrl = `${window.location.origin}/calendar/${calendar.id}`;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSending(true);
    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Use the create_calendar_invite function instead of direct insert
      const { data, error } = await supabase.rpc('create_calendar_invite', {
        p_calendar_id: calendar.id,
        p_recipient_email: email.toLowerCase().trim()
      });

      if (error) throw error;

      // Send the email notification
      const { error: emailError } = await supabase.functions.invoke('send-calendar-invite', {
        body: {
          calendarId: calendar.id,
          recipientEmail: email,
          calendarName: calendar.name,
          shareUrl: `${window.location.origin}/calendar/${calendar.id}`
        }
      });

      if (emailError) throw emailError;

      toast.success('Invitation sent successfully');
      setEmail('');
      onClose();
    } catch (err) {
      console.error('Error sending invite:', err);
      
      // Handle duplicate key error gracefully
      if (err instanceof Error && 
          (err.message.includes('duplicate key value') || 
           err.message.includes('Pending invite already exists'))) {
        toast.info('An invitation has already been sent to this email address');
        setEmail('');
        onClose();
        return;
      }
      
      toast.error('Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      toast.success('Link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Subscribe to ${calendar.name}`,
          text: `Check out my calendar "${calendar.name}" on Calenlist!`,
          url: calendarUrl
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleEmailInvite = () => {
    const subject = encodeURIComponent(`Subscribe to my calendar: ${calendar.name}`);
    const body = encodeURIComponent(
      `Hi!\n\n` +
      `I just created a new calendar on Calenlist and would love for you to subscribe.\n\n` +
      `You can view and subscribe to my events here:\n` +
      `${calendarUrl}\n\n` +
      `Best regards`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Share Your Calendar</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Share Your Calendar
            </h3>
            <p className="text-gray-600">
              Invite others to subscribe to your calendar
            </p>
          </div>

          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending || !email}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <Mail className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Invitation'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Or share your calendar link directly:
            </p>
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
              <span className="text-sm text-gray-600 truncate mr-2">
                {calendarUrl}
              </span>
              <button
                onClick={handleShare}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}