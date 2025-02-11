import { supabase } from '../lib/supabase';

export interface Subscriber {
  email: string;
  display_name: string;
  subscribed_at: string;
}

export async function fetchSubscribers(calendarId: string): Promise<Subscriber[]> {
  try {
    // Validate input
    if (!calendarId) {
      console.warn('Invalid calendar ID for fetching subscribers');
      return [];
    }

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

    if (error) {
      // Log error but return empty array instead of throwing
      console.error('Error fetching subscribers:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Transform and validate the data
    return data
      .filter(item => item.profiles && item.profiles.email) // Filter out any invalid entries
      .map(item => ({
        email: item.profiles.email,
        display_name: item.profiles.display_name,
        subscribed_at: item.created_at
      }));
  } catch (err) {
    // Catch any unexpected errors
    console.error('Unexpected error fetching subscribers:', err);
    return [];
  }
}