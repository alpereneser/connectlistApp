-- Create function to search auth.users table by display_name
-- This function can access auth.users table with proper permissions

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
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'display_name', '') as display_name,
    COALESCE(u.raw_user_meta_data->>'full_name', '') as full_name,
    COALESCE(u.raw_user_meta_data->>'avatar_url', '') as avatar_url,
    COALESCE(u.raw_user_meta_data->>'bio', '') as bio,
    u.created_at
  FROM 
    auth.users u
  WHERE 
    search_query IS NULL OR search_query = '' OR
    (
      -- Search in display_name (from raw_user_meta_data)
      LOWER(COALESCE(u.raw_user_meta_data->>'display_name', '')) LIKE LOWER('%' || search_query || '%') OR
      -- Search in full_name (from raw_user_meta_data)
      LOWER(COALESCE(u.raw_user_meta_data->>'full_name', '')) LIKE LOWER('%' || search_query || '%') OR
      -- Search in email
      LOWER(COALESCE(u.email, '')) LIKE LOWER('%' || search_query || '%')
    )
  ORDER BY
    -- Exact display_name matches first
    CASE WHEN LOWER(COALESCE(u.raw_user_meta_data->>'display_name', '')) = LOWER(search_query) THEN 0 ELSE 1 END,
    -- Then exact full_name matches
    CASE WHEN LOWER(COALESCE(u.raw_user_meta_data->>'full_name', '')) = LOWER(search_query) THEN 0 ELSE 1 END,
    -- Then by created date (newest first)
    u.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_auth_users(text) TO authenticated;
GRANT EXECUTE ON FUNCTION search_auth_users(text) TO anon;