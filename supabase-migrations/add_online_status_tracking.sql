-- Add online status tracking to profiles table
-- Run this migration in your Supabase SQL editor

-- Add columns for online status tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Create index on last_seen for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- Create index on is_online for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON profiles(is_online);

-- Create a function to automatically set users offline after 10 minutes of inactivity
CREATE OR REPLACE FUNCTION set_inactive_users_offline()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET is_online = false 
  WHERE is_online = true 
  AND last_seen < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PERMISSIONS AND RLS POLICIES
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update online status" ON profiles;

-- Create policy for reading profiles
CREATE POLICY "Users can view all active profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Create policy for updating own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Enable RLS on pharmacy_memberships table
ALTER TABLE pharmacy_memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own memberships" ON pharmacy_memberships;

-- Create policy for reading pharmacy memberships
CREATE POLICY "Users can view all memberships" 
ON pharmacy_memberships FOR SELECT 
TO authenticated 
USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON pharmacy_memberships TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Specifically grant permissions needed for online status operations
GRANT SELECT (id, user_name, full_name, role, is_active, last_seen, is_online) ON profiles TO authenticated;
GRANT UPDATE (is_online, last_seen) ON profiles TO authenticated;
GRANT SELECT ON pharmacy_memberships TO authenticated;