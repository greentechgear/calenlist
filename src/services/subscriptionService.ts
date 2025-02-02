import { supabase } from '../lib/supabase';

export async function checkSubscription(calendarId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('calendar_id', calendarId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error checking subscription:', error);
    return false;
  }

  return data.length > 0;
}