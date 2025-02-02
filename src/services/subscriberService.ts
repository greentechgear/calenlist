import { supabase } from '../lib/supabase';

export interface Subscriber {
  email: string;
  display_name: string;
  subscribed_at: string;
}

export async function fetchSubscribers(calendarId: string): Promise<Subscriber[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      created_at,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq('calendar_id', calendarId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(item => ({
    email: item.profiles.email,
    display_name: item.profiles.display_name,
    subscribed_at: item.created_at
  }));
}