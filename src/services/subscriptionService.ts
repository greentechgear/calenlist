import { supabase } from '../lib/supabase';

export async function checkSubscription(calendarId: string, userId: string): Promise<boolean> {
  try {
    // Validate inputs
    if (!calendarId || !userId) {
      console.warn('Invalid parameters for subscription check:', { calendarId, userId });
      return false;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('calendar_id', calendarId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Log error but don't throw - return false instead
      console.error('Error checking subscription:', error);
      return false;
    }

    return !!data;
  } catch (err) {
    // Catch any unexpected errors
    console.error('Unexpected error checking subscription:', err);
    return false;
  }
}