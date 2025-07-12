-- Insert missing categories
INSERT INTO public.categories (name, display_name, icon) VALUES
('videos', 'Videos', 'play-circle'),
('movies', 'Movies', 'film'),
('tv_shows', 'TV Shows', 'television'),
('books', 'Books', 'book'),
('games', 'Games', 'game-controller'),
('places', 'Places', 'map-pin'),
('person', 'People', 'user')
ON CONFLICT (name) DO NOTHING;