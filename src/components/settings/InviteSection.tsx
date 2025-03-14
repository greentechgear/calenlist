import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Calendar } from '../../types/calendar';
import ShareCalendarModal from './ShareCalendarModal';

interface InviteSectionProps {
  calendar: Calendar;
}

export default function InviteSection({ calendar }: InviteSectionProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Invite Others</h2>
      
      <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-lg mb-4">
          <p className="text-purple-900">
            Share your calendar with others so they can stay updated with your events
          </p>
        </div>

        <button
          onClick={() => setShowShareModal(true)}
          className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Mail className="h-4 w-4 mr-2" />
          Share Calendar
        </button>
      </div>

      <ShareCalendarModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        calendar={calendar}
      />
    </div>
  );
}