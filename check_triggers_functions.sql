-- Mevcut trigger'ları kontrol et
SELECT 
    trigger_name,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_schema IN ('auth', 'public')
ORDER BY event_object_table, trigger_name;

-- Mevcut functions kontrol et
SELECT 
    routine_name,
    SUBSTRING(routine_definition, 1, 200) as definition_start
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (routine_name LIKE '%user%' OR routine_name LIKE '%profile%')
ORDER BY routine_name;