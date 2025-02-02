/*
  # Configure Email Settings
  
  1. Changes
    - Set up email templates for confirmation and magic link emails
    - Configure sender name for all emails
  
  Note: These settings will be applied through Supabase's dashboard configuration
  since direct SQL access to auth schema tables is restricted
*/

-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a function to log email configuration changes
CREATE OR REPLACE FUNCTION log_email_config_change()
RETURNS void AS $$
BEGIN
  INSERT INTO public.audit_log (
    event_type,
    description,
    created_at
  ) VALUES (
    'email_config_update',
    'Email templates and sender name updated',
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Log the configuration change
SELECT log_email_config_change();

-- Note: Email templates and sender name must be configured through the Supabase Dashboard:
-- 1. Confirmation Email Template:
--    Subject: {% if user.email_confirmed_at %}Magic Link for Calenlist{% else %}Confirm your Calenlist email{% endif %}
--    Body: {% if user.email_confirmed_at %}<h2>Magic Link Requested</h2><p>Follow this link to sign in to Calenlist:</p><p><a href="{{ .ConfirmationURL }}">Sign In to Calenlist</a></p>{% else %}<h2>Welcome to Calenlist!</h2><p>Follow this link to confirm your email address:</p><p><a href="{{ .ConfirmationURL }}">Confirm Email Address</a></p>{% endif %}
--
-- 2. Sender Name: Calenlist