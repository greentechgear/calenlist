import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      calendarId,
      rating,
      comment,
      userDisplayName
    } = await req.json();

    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL');
    const replyToEmail = Deno.env.get('REPLY_TO_EMAIL');

    if (!resendApiKey || !fromEmail || !replyToEmail) {
      throw new Error('Missing required environment variables');
    }

    // Get calendar owner's email from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const calendarResponse = await fetch(
      `${supabaseUrl}/rest/v1/calendars?id=eq.${calendarId}&select=name,user_id,profiles(email,display_name)`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    const [calendar] = await calendarResponse.json();
    if (!calendar?.profiles?.email) {
      throw new Error('Calendar owner not found');
    }

    // Send email using Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Calenlist <${fromEmail}>`,
        reply_to: replyToEmail,
        to: calendar.profiles.email,
        subject: `New Feedback for ${calendar.name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7C3AED; margin-bottom: 20px;">New Calendar Feedback</h2>
            
            <p style="margin-bottom: 20px;">
              ${userDisplayName} has left feedback for ${calendar.name}.
            </p>

            <div style="background-color: #F5F3FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #6D28D9;">
                <strong>Rating:</strong> ${rating}/5
              </p>
              ${comment ? `
                <p style="margin: 10px 0 0 0; color: #6D28D9;">
                  <strong>Comment:</strong><br>
                  ${comment}
                </p>
              ` : ''}
            </div>

            <p style="color: #666; font-size: 14px;">
              You can view all feedback in your calendar settings.
            </p>
          </div>
        `,
        tags: [
          { name: 'category', value: 'event_feedback' }
        ]
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to send email');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending feedback notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send notification'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});