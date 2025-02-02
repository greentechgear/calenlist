import { supabase } from '../lib/supabase';

interface CalendarLinks {
  streaming_urls: { Twitch?: string; YouTube?: string };
  custom_url: string | null;
}

export async function updateCalendarLinks(calendarId: string, userId: string, links: CalendarLinks) {
  const { error } = await supabase
    .from('calendars')
    .update({
      streaming_urls: links.streaming_urls,
      custom_url: links.custom_url
    })
    .eq('id', calendarId)
    .eq('user_id', userId);

  if (error) throw error;
}