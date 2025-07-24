
-- Add authentication fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS session_token TEXT,
ADD COLUMN IF NOT EXISTS session_expires TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_session_token ON restaurants(session_token);
CREATE INDEX IF NOT EXISTS idx_restaurants_api_key ON restaurants(api_key);
