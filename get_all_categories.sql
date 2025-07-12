-- Get all category UUIDs
SELECT id, name, display_name FROM public.categories 
WHERE name IN ('videos', 'movies', 'tv_shows', 'books', 'games', 'places', 'person')
ORDER BY name;