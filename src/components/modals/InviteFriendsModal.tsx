import React from 'react';
import { X, Mail, Copy, Share2 } from 'lucide-react';
import { Calendar } from '../../types/calendar';

interface InviteFriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: Calendar;
}

export default function InviteFriendsModal({ isOpen, onClose, calendar }: InviteFriendsModalProps) {
  if (!isOpen) return null;

  const calendarUrl = `${window.location.origin}/calendar/${calendar.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
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
              Calendar Created Successfully!
            </h3>
            <p className="text-gray-600">
              Share your calendar with others so they can stay updated with your events
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleEmailInvite}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Email Invitation
            </button>

            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              {navigator.share ? (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Calendar
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}