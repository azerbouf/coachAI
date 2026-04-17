-- Add OAuth token storage to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS garmin_oauth1_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS garmin_oauth2_token_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS garmin_token_expires_at TIMESTAMPTZ;
