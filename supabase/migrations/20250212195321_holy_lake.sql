-- Drop existing unique index
DROP INDEX IF EXISTS calendar_invites_active_unique;

-- Drop any existing invites that are duplicates but keep the most recent one
WITH DuplicateInvites AS (
  SELECT id
  FROM (
    SELECT 
      id,
      calendar_id,
      recipient_email,
      status,
      ROW_NUMBER() OVER (
        PARTITION BY calendar_id, recipient_email, status
        ORDER BY created_at DESC
      ) as rn
    FROM calendar_invites
    WHERE status = 'pending'
  ) ranked
  WHERE rn > 1
)
DELETE FROM calendar_invites
WHERE id IN (SELECT id FROM DuplicateInvites);

-- Create new unique index that properly enforces one pending invite per calendar/recipient
CREATE UNIQUE INDEX calendar_invites_active_unique 
  ON calendar_invites(calendar_id, recipient_email) 
  WHERE status = 'pending';

-- Update RLS policies to prevent duplicate invites
DROP POLICY IF EXISTS "calendar_invites_insert_policy" ON calendar_invites;
CREATE POLICY "calendar_invites_insert_policy" ON calendar_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Calendar owner can send invites
    EXISTS (
      SELECT 1 FROM calendars c
      WHERE c.id = calendar_id
      AND c.user_id = auth.uid()
    ) AND
    -- Prevent duplicate pending invites
    NOT EXISTS (
      SELECT 1 FROM calendar_invites ci
      WHERE ci.calendar_id = calendar_invites.calendar_id
      AND ci.recipient_email = calendar_invites.recipient_email
      AND ci.status = 'pending'
    )
  );

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');