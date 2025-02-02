-- Add design-related columns to calendars table
ALTER TABLE calendars
ADD COLUMN IF NOT EXISTS theme_color text,
ADD COLUMN IF NOT EXISTS secondary_color text,
ADD COLUMN IF NOT EXISTS font_family text,
ADD COLUMN IF NOT EXISTS custom_css text,
ADD COLUMN IF NOT EXISTS layout_type text DEFAULT 'standard' CHECK (layout_type IN ('standard', 'compact', 'grid', 'list')),
ADD COLUMN IF NOT EXISTS show_time_zones boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_header_html text,
ADD COLUMN IF NOT EXISTS custom_footer_html text,
ADD COLUMN IF NOT EXISTS branding_options jsonb DEFAULT '{}'::jsonb;

-- Add constraint for valid color formats
ALTER TABLE calendars
ADD CONSTRAINT valid_color_format
CHECK (
  (theme_color IS NULL OR theme_color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$') AND
  (secondary_color IS NULL OR secondary_color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
);

-- Add constraint for valid font families
ALTER TABLE calendars
ADD CONSTRAINT valid_font_family
CHECK (
  font_family IS NULL OR
  font_family IN (
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Source Sans Pro',
    'Poppins'
  )
);

-- Add constraint for custom CSS size
ALTER TABLE calendars
ADD CONSTRAINT custom_css_length
CHECK (length(custom_css) <= 10000);

-- Add constraint for custom HTML size
ALTER TABLE calendars
ADD CONSTRAINT custom_html_length
CHECK (
  length(custom_header_html) <= 5000 AND
  length(custom_footer_html) <= 5000
);

-- Add index for layout type
CREATE INDEX calendars_layout_type_idx ON calendars(layout_type);

COMMENT ON COLUMN calendars.theme_color IS 'Primary theme color in hex format';
COMMENT ON COLUMN calendars.secondary_color IS 'Secondary color in hex format';
COMMENT ON COLUMN calendars.font_family IS 'Primary font family for the calendar';
COMMENT ON COLUMN calendars.custom_css IS 'Custom CSS for advanced styling';
COMMENT ON COLUMN calendars.layout_type IS 'Calendar layout type (standard, compact, grid, list)';
COMMENT ON COLUMN calendars.show_time_zones IS 'Whether to show multiple time zones';
COMMENT ON COLUMN calendars.custom_header_html IS 'Custom HTML for calendar header';
COMMENT ON COLUMN calendars.custom_footer_html IS 'Custom HTML for calendar footer';
COMMENT ON COLUMN calendars.branding_options IS 'Additional branding options as JSON';