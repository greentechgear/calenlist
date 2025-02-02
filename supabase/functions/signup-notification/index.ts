import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { record } = body;

    if (!record?.email || !record?.id) {
      throw new Error('Missing required user data');
    }

    // Get environment variables
    const adminEmail = Deno.env.get('ADMIN_EMAIL');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL');
    const replyToEmail = Deno.env.get('REPLY_TO_EMAIL');

    // Validate required environment variables
    if (!adminEmail || !resendApiKey || !fromEmail || !replyToEmail) {
      throw new Error('Missing required environment variables');
    }

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: true,
        }
      }
    );

    // Check for existing log within last minute to prevent duplicates
    const { data: existingLog } = await supabaseAdmin
      .from('signup_logs')
      .select('id, response_data')
      .eq('user_id', record.id)
      .eq('email', record.email)
      .is('error_message', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If we have a successful log and it already has notification data, skip
    if (existingLog?.response_data?.notification_sent) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, message: 'Notification already sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email using Resend with proper configuration
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `Calenlist <${fromEmail}>`,
        reply_to: replyToEmail,
        to: adminEmail,
        subject: 'New Calenlist Signup',
        html: `
          <h2 style="color: #6B46C1; margin-bottom: 20px;">New User Signup</h2>
          <p>A new user has signed up for Calenlist:</p>
          <ul style="margin: 20px 0; padding-left: 20px;">
            <li><strong>Email:</strong> ${record.email}</li>
            <li><strong>User ID:</strong> ${record.id}</li>
            <li><strong>Signup Time:</strong> ${new Date().toLocaleString()}</li>
          </ul>
        `,
        headers: {
          'X-Entity-Ref-ID': record.id,
          'List-Unsubscribe': `<mailto:${replyToEmail}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        tags: [
          { name: 'category', value: 'signup_notification' }
        ]
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(`Failed to send email: ${errorData.message || res.status}`);
    }

    const data = await res.json();

    // If we found an existing log, update it instead of creating a new one
    if (existingLog?.id) {
      await supabaseAdmin
        .from('signup_logs')
        .update({
          response_data: {
            notification_sent: true,
            resend_id: data.id,
            timestamp: new Date().toISOString()
          }
        })
        .eq('id', existingLog.id);
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in signup notification:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});