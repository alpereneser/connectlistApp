-- Fix RLS policies for users_profiles table
-- Users should be able to insert their own profile during registration

-- First, check if RLS is enabled and drop existing policies
ALTER TABLE users_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON users_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON users_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON users_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users based on user_id" ON users_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users_profiles;

-- Create comprehensive RLS policies
-- 1. Allow everyone to view profiles (public profiles)
CREATE POLICY "Enable read access for all users" ON users_profiles
    FOR SELECT USING (true);

-- 2. Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for authenticated users based on user_id" ON users_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "Enable update for users based on user_id" ON users_profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Allow users to delete their own profile (optional)
CREATE POLICY "Enable delete for users based on user_id" ON users_profiles
    FOR DELETE USING (auth.uid() = id);

-- Grant necessary permissions to authenticated role
GRANT ALL ON users_profiles TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;