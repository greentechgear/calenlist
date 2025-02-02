import React, { useState, useEffect } from 'react';
import { Calendar, MousePointerClick } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Calendar as CalendarType } from '../../types/calendar';

export default function ExampleCalendar() {
  const [calendar, setCalendar] = useState<CalendarType | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRandomCalendar = async () => {
      try {
        // Get a random public calendar with subscribers
        const { data, error } = await supabase
          .from('calendars')
          .select(`
            *,
            profiles!calendars_user_id_fkey(display_name),
            calendar_stats(subscriber_count)
          `)
          .eq('is_public', true)
          .gt('calendar_stats.subscriber_count', 0)
          .limit(1)
          .single();

        if (error) throw error;
        setCalendar(data);
      } catch (err) {
        console.error('Error fetching random calendar:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRandomCalendar();
  }, []);

  const handleCalendarClick = () => {
    if (calendar) {
      navigate(`/calendar/${calendar.id}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Calendar className="h-8 w-8 text-purple-600 animate-pulse" />
              <h2 className="text-3xl font-bold text-gray-900">Loading Example Calendar...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!calendar) {
    return null;
  }

  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Calendar className="h-8 w-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">See It In Action</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Check out how {calendar.profiles?.display_name || 'our community'} uses Calenlist to manage their events and engage with their audience
          </p>
        </div>

        <div 
          className="relative aspect-[16/9] rounded-lg overflow-hidden shadow-xl border border-gray-200 cursor-pointer hover:shadow-2xl transition-shadow"
          onClick={handleCalendarClick}
        >
          <iframe
            src={`/calendar/${calendar.id}`}
            className="absolute inset-0 w-full h-full pointer-events-none"
            title={`${calendar.name} Calendar Example`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10">
            <div className="absolute bottom-4 left-4 flex items-center space-x-2 text-white text-sm">
              <MousePointerClick className="h-4 w-4" />
              <span>Click to view full calendar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}