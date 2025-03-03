import { supabase } from './supabase';

export async function configureGoogleCalendar(calendarId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar-configure', {
      body: { calendarId }
    });

    if (error) {
      // If unauthorized, trigger Google OAuth
      if (error.message.includes('unauthorized') || error.message.includes('auth')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: 'https://www.googleapis.com/auth/calendar',
            redirectTo: window.location.href
          }
        });

        if (signInError) throw signInError;
        return null; // OAuth redirect will happen automatically
      }
      throw error;
    }
    return data.calendarUrl;
  } catch (err) {
    console.error('Error configuring Google Calendar:', err);
    throw err;
  }
}

export async function createGoogleCalendar(name: string, description?: string) {
  try {
    const { data, error } = await supabase.functions.invoke('google-calendar-create', {
      body: { name, description }
    });

    if (error) {
      // If unauthorized, trigger Google OAuth
      if (error.message.includes('unauthorized') || error.message.includes('auth')) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            scopes: 'https://www.googleapis.com/auth/calendar',
            redirectTo: window.location.href
          }
        });

        if (signInError) throw signInError;
        return null; // OAuth redirect will happen automatically
      }
      throw error;
    }
    return data.calendar;
  } catch (err) {
    console.error('Error creating Google Calendar:', err);
    throw err;
  }
}