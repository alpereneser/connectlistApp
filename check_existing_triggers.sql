-- Mevcut trigger'ları kontrol et
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement,
    action_timing,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' OR event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Mevcut functions kontrol et
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;

-- Mevcut RLS policies kontrol et
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users_profiles'
ORDER BY tablename, policyname;

-- users_profiles tablosunun yapısını kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users_profiles'
ORDER BY ordinal_position;