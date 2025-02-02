import React, { useState } from 'react';
import { Mail, Copy, Check } from 'lucide-react';
import { Calendar } from '../../types/calendar';

interface InviteSectionProps {
  calendar: Calendar;
}

export default function InviteSection({ calendar }: InviteSectionProps) {
  const [copied, setCopied] = useState(false);
  const calendarUrl = `${window.location.origin}/calendar/${calendar.id}`;

  const handleEmailInvite = () => {
    const subject = encodeURIComponent(`Subscribe to my calendar: ${calendar.name}`);
    const body = encodeURIComponent(
      `Hi!\n\n` +
      `I'd love for you to subscribe to my calendar on Calenlist.\n\n` +
      `You can view and subscribe to my events here:\n` +
      `${calendarUrl}\n\n` +
      `Best regards`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Invite Others</h2>
      
      <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-purple-900">
            Share your calendar with others so they can stay updated with your events
          </p>
        </div>

        <button
          onClick={handleEmailInvite}
          className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Mail className="h-4 w-4 mr-2" />
          Send Email Invitation
        </button>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calenlist URL
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={calendarUrl}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm"
            />
            <button
              onClick={handleCopy}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title={copied ? 'Copied!' : 'Copy URL'}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}