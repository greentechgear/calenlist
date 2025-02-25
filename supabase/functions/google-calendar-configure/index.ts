import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { calendarId, accessToken } = await req.json();

    if (!calendarId || !accessToken) {
      throw new Error('Missing required parameters');
    }

    // Make calendar public
    const updateResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selected: true,
          timeZone: 'UTC'
        })
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to update calendar settings');
    }

    // Get calendar's ICS URL
    const calendarUrl = `https://calendar.google.com/calendar/ical/${calendarId}/public/basic.ics`;

    return new Response(
      JSON.stringify({ calendarUrl }),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});