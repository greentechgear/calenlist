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
      recipientEmail,
      calendarName,
      shareUrl
    } = await req.json();

    // Validate required fields
    if (!calendarId || !recipientEmail || !calendarName || !shareUrl) {
      throw new Error('Missing required fields');
    }

    // Get environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL');
    const replyToEmail = Deno.env.get('REPLY_TO_EMAIL');

    if (!resendApiKey || !fromEmail || !replyToEmail) {
      console.error('Missing environment variables:', {
        hasResendKey: !!resendApiKey,
        hasFromEmail: !!fromEmail,
        hasReplyTo: !!replyToEmail
      });
      throw new Error('Missing required environment variables');
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
        to: recipientEmail,
        subject: `Calendar Invitation: ${calendarName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7C3AED; margin-bottom: 20px;">Calendar Invitation</h2>
            
            <p style="margin-bottom: 20px;">
              You've been invited to subscribe to the calendar "${calendarName}" on Calenlist.
            </p>

            <div style="margin: 30px 0;">
              <a href="${shareUrl}" 
                 style="background-color: #7C3AED; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                View Calendar
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              If you don't have a Calenlist account yet, you'll be guided through the signup process.
            </p>
          </div>
        `,
        tags: [
          { name: 'category', value: 'calendar_invite' }
        ]
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error('Resend API error:', error);
      throw new Error(error.message || 'Failed to send email');
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending invite:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send invitation'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});