-- Disable auth trigger that's causing 500 errors during signup
-- We'll handle profile creation in the application code instead

-- Drop all auth-related triggers and functions that might be causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_user_profile();

-- The profile creation will now be handled in the register.tsx file
-- This is safer and gives us more control over error handling