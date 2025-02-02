import { supabase, supabaseQuery } from '../lib/supabase';
import type { Calendar } from '../types/calendar';
import { CalendarBanner } from '../types/banner';

interface UpdateCalendarParams {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  googleCalendarUrl: string;
  categoryId: string;
  demoVideoUrl: string | null;
  isPublic: boolean;
  banner: CalendarBanner;
}

export async function updateCalendar({
  id,
  userId,
  name,
  description,
  googleCalendarUrl,
  categoryId,
  demoVideoUrl,
  isPublic,
  banner
}: UpdateCalendarParams) {
  const { error } = await supabase
    .from('calendars')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      google_calendar_url: googleCalendarUrl.trim(),
      category_id: categoryId,
      demo_video_url: demoVideoUrl?.trim() || null,
      is_public: isPublic,
      banner
    })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getTopCalendars(limit = 6): Promise<Calendar[]> {
  try {
    // First get the calendar stats
    const statsData = await supabaseQuery(() => 
      supabase
        .from('calendar_stats')
        .select('calendar_id, subscriber_count')
        .order('subscriber_count', { ascending: false })
        .limit(limit)
    );

    if (!statsData?.length) {
      return [];
    }

    // Get the calendar IDs from the stats
    const calendarIds = statsData.map(stat => stat.calendar_id);

    // Then fetch the calendars with those IDs
    const calendarsData = await supabaseQuery(() =>
      supabase
        .from('calendars')
        .select(`
          *,
          profiles!calendars_user_id_fkey (
            display_name
          )
        `)
        .eq('is_public', true)
        .in('id', calendarIds)
    );

    // Merge the stats with the calendar data
    return calendarsData
      .map(calendar => {
        const stats = statsData.find(stat => stat.calendar_id === calendar.id);
        return {
          ...calendar,
          subscriber_count: stats?.subscriber_count || 0
        };
      })
      .sort((a, b) => (b.subscriber_count || 0) - (a.subscriber_count || 0));
  } catch (error) {
    console.error('Error fetching top calendars:', error);
    return [];
  }
}