-- Sadece eksik olan trigger'ı ekle (mevcut olanları bozmadan)

-- Önce mevcut trigger'ı kontrol et
DO $$
BEGIN
    -- Eğer trigger yoksa oluştur
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        
        -- Önce fonksiyonu oluştur (varsa güncelle)
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $trigger$
        BEGIN
          -- users_profiles'a insert et (eğer yoksa)
          INSERT INTO public.users_profiles (
            id, 
            username, 
            full_name,
            created_at,
            updated_at
          )
          VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTR(NEW.id::text, 1, 8)),
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO NOTHING; -- Eğer zaten varsa hiçbir şey yapma
          
          RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Trigger'ı oluştur
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
          
        RAISE NOTICE 'Trigger created successfully';
    ELSE
        RAISE NOTICE 'Trigger already exists';
    END IF;
END
$$;