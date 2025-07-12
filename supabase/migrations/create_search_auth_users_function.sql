-- Create RPC function to search auth users
-- This function allows searching users from the auth.users table

CREATE OR REPLACE FUNCTION search_auth_users(search_query text)
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Search in auth.users table based on email and metadata
  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    (u.raw_user_meta_data->>'display_name')::text as display_name,
    (u.raw_user_meta_data->>'full_name')::text as full_name,
    (u.raw_user_meta_data->>'avatar_url')::text as avatar_url,
    (u.raw_user_meta_data->>'bio')::text as bio,
    u.created_at
  FROM auth.users u
  WHERE 
    u.email_confirmed_at IS NOT NULL -- Only confirmed users
    AND (
      LOWER(u.email::text) LIKE '%' || LOWER(search_query) || '%'
      OR LOWER(u.raw_user_meta_data->>'display_name') LIKE '%' || LOWER(search_query) || '%'
      OR LOWER(u.raw_user_meta_data->>'full_name') LIKE '%' || LOWER(search_query) || '%'
    )
  ORDER BY u.created_at DESC
  LIMIT 50;
END;
$$;