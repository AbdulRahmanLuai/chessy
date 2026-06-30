-- Add nullable column first
ALTER TABLE users ADD COLUMN username TEXT UNIQUE;

-- Fill existing rows with a generated username (safe because column is currently nullable)
UPDATE users SET username = 'user_' || substr(id::text, 1, 8) WHERE username IS NULL;

-- Now make it required
ALTER TABLE users ALTER COLUMN username SET NOT NULL;