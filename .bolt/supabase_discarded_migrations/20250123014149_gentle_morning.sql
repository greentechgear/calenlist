-- Update category colors to match banner theme
UPDATE calendar_categories
SET color = CASE id
  -- Office Hours - Indigo to match Indigo Waves
  WHEN '37e3806e-d47c-4ae3-9c12-44a671dcd7c3' THEN '#4F46E5'
  
  -- Consulting - Ocean Blue to match Ocean Breeze
  WHEN '8a9d6a4f-6d77-4c5c-9de9-9e6e9520cb6a' THEN '#0891B2'
  
  -- Webinar - Rose to match Rose Garden
  WHEN 'f7d97cf3-43fb-4185-9d34-e50d7c0b8985' THEN '#E11D48'
  
  -- Workshop - Amber to match Amber Sunset
  WHEN 'c2e3a26e-fd0e-4d43-b930-2b1c8c5fd1b1' THEN '#D97706'
  
  -- Conference - Violet to match Violet Night
  WHEN '9b5e9d6a-0d8f-4c8a-9e4e-6d8f3b7c5a2e' THEN '#9333EA'
  
  -- Community - Sky Blue to match Sky Breeze
  WHEN 'e4d97cf3-43fb-4185-9d34-e50d7c0b8985' THEN '#0369A1'
  
  ELSE color
END;