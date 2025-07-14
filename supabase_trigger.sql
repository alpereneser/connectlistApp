-- Kullanıcı kayıt olduğunda otomatik profil oluşturan trigger
-- Bu kodu Supabase Dashboard > SQL Editor'da çalıştırın

-- Önce mevcut trigger'ı kaldıralım (varsa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Yeni kullanıcı profili oluşturan fonksiyon
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users_profiles (
    id, 
    username, 
    full_name,
    bio,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTR(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NULL,
    NULL,
    NOW(),
    NOW()
  );
  
  -- User notification settings oluştur
  INSERT INTO public.user_notification_settings (
    user_id,
    email_notifications,
    push_notifications,
    list_likes,
    list_comments,
    new_followers,
    list_shares
  )
  VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true,
    true
  );
  
  -- User privacy settings oluştur
  INSERT INTO public.user_privacy_settings (
    user_id,
    profile_visibility,
    allow_friend_requests,
    allow_list_comments,
    allow_list_likes
  )
  VALUES (
    NEW.id,
    'public',
    true,
    true,
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies güncelle
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all public profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.users_profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.users_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.users_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users_profiles TO anon, authenticated;
GRANT ALL ON public.user_notification_settings TO anon, authenticated;
GRANT ALL ON public.user_privacy_settings TO anon, authenticated;