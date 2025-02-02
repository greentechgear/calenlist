import React, { useState } from 'react';
import { updateCalendarLinks } from '../../services/calendarLinksService';
import { toast } from '../../utils/toast';
import CalendarLinksForm from './CalendarLinksForm';

interface CalendarLinksSectionProps {
  calendarId: string;
  userId: string;
  initialLinks: {
    Twitch?: string;
    YouTube?: string;
    customUrl?: string;
  };
  onUpdate: () => Promise<void>;
}

export default function CalendarLinksSection({ 
  calendarId, 
  userId,
  initialLinks,
  onUpdate
}: CalendarLinksSectionProps) {
  const [saving, setSaving] = useState(false);

  const handleSaveLinks = async (links: {
    streaming_urls: { Twitch?: string; YouTube?: string };
    custom_url: string | null;
  }) => {
    setSaving(true);
    try {
      await updateCalendarLinks(calendarId, userId, links);
      toast.success('Links updated successfully');
      await onUpdate();
    } catch (error) {
      console.error('Error updating links:', error);
      toast.error('Failed to update links');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Calendar Links</h2>
      <CalendarLinksForm
        initialLinks={initialLinks}
        onSave={handleSaveLinks}
        saving={saving}
      />
    </div>
  );
}