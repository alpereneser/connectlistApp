-- Check if categories exist
SELECT * FROM public.categories WHERE name IN ('videos', 'movies', 'tv_shows', 'books', 'games', 'places', 'person');