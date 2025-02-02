import { supabase } from '../lib/supabase';

export interface EventFeedback {
  event_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    display_name: string;
  };
}

export async function fetchEventFeedback(calendarId: string): Promise<EventFeedback[]> {
  const { data, error } = await supabase
    .from('event_feedback')
    .select(`
      event_id,
      rating,
      comment,
      created_at,
      profiles (
        display_name
      )
    `)
    .eq('calendar_id', calendarId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}