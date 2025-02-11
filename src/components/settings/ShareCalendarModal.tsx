import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Calendar } from '../../types/calendar';
import { toast } from '../../utils/toast';

interface ShareCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: Calendar;
}

export default function ShareCalendarModal({ isOpen, onClose, calendar }: ShareCalendarModalProps) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSending(true);
    try {
      // Store the invite in the database
      const { error: inviteError } = await supabase
        .from('calendar_invites')
        .insert({
          calendar_id: calendar.id,
          sender_id: calendar.user_id,
          recipient_email: email.toLowerCase().trim()
        });

      if (inviteError) throw inviteError;

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
      toast.error('Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Send Email Invitation</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            The recipient will receive an email with a link to subscribe to your calendar.
          </p>

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
        </div>
      </div>
    </div>
  );
}