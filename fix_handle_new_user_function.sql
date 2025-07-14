-- Mevcut handle_new_user function'ını güncelle
-- Bu function kullanıcı kayıt olduğunda otomatik çalışıyor

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profiles (
    id,
    username,
    full_name,
    bio,
    avatar_url,
    website,
    location,
    followers_count,
    following_count,
    lists_count,
    is_private,
    is_verified,
    is_online,
    social_links,
    preferences,
    push_notifications_enabled,
    created_at,
    updated_at,
    last_seen
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NULL, -- bio null olarak bırak
    NULL, -- avatar_url null olarak bırak
    NULL, -- website null olarak bırak
    NULL, -- location null olarak bırak
    0,    -- followers_count
    0,    -- following_count
    0,    -- lists_count
    false, -- is_private
    false, -- is_verified
    false, -- is_online
    '{}'::jsonb, -- social_links
    '{}'::jsonb, -- preferences
    true,  -- push_notifications_enabled
    NOW(),
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;