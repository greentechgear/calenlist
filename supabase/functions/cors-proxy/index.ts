import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { calendarUrl } = await req.json()
    
    if (!calendarUrl) {
      return new Response(
        JSON.stringify({ error: 'Calendar URL is required' }),
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    // Fetch the ICS file with proper error handling
    const response = await fetch(calendarUrl, {
      headers: {
        'Accept': 'text/calendar',
        'User-Agent': 'Calenlist/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar data: ${response.status} ${response.statusText}`);
    }

    const icsData = await response.text();

    // Validate that we received calendar data
    if (!icsData.includes('BEGIN:VCALENDAR')) {
      throw new Error('Invalid calendar data received');
    }

    return new Response(
      JSON.stringify({ 
        data: icsData,
        status: 'success'
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('CORS proxy error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to fetch calendar data',
        status: 'error'
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});