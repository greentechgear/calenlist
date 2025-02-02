-- Set the service role configuration with the correct values
SELECT set_service_role_config(
  'https://djcicswhmqxwxvuflkad.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqY2ljc3dobXF4d3h2dWZsa2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTE1MzQ0MSwiZXhwIjoyMDUwNzI5NDQxfQ.Wd_hkHNKvfGQqYXyFHrZGHFXYGYBCZBDtLGOYvGLOYE'
);

-- Verify the configuration was set correctly
SELECT * FROM check_service_role_config();

-- Refresh materialized views that might depend on the service role
REFRESH MATERIALIZED VIEW calendar_stats;