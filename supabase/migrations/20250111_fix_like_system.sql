-- Fix list_likes and item_likes tables foreign key references
-- The issue is that these tables are referencing auth.users instead of users_profiles

-- First, drop existing tables and their dependencies
DROP TABLE IF EXISTS list_likes CASCADE;
DROP TABLE IF EXISTS item_likes CASCADE;
DROP TABLE IF EXISTS list_follows CASCADE;

-- Create list_likes table with correct reference to users_profiles
CREATE TABLE list_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, list_id)
);

-- Create item_likes table with correct reference to users_profiles
CREATE TABLE item_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES list_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- Create list_follows table with correct reference to users_profiles
CREATE TABLE list_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, list_id)
);

-- Enable RLS on all tables
ALTER TABLE list_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for list_likes
CREATE POLICY "Users can view all list likes" ON list_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own list likes" ON list_likes
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for item_likes
CREATE POLICY "Users can view all item likes" ON item_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own item likes" ON item_likes
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for list_follows
CREATE POLICY "Users can view all list follows" ON list_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own list follows" ON list_follows
    FOR ALL USING (auth.uid() = user_id);

-- Create or replace function to update list likes count
CREATE OR REPLACE FUNCTION update_list_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE lists SET likes_count = likes_count + 1 WHERE id = NEW.list_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE lists SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.list_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to update item likes count
CREATE OR REPLACE FUNCTION update_item_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE list_items SET likes_count = likes_count + 1 WHERE id = NEW.item_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE list_items SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.item_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating counts
DROP TRIGGER IF EXISTS list_likes_count_trigger ON list_likes;
CREATE TRIGGER list_likes_count_trigger
    AFTER INSERT OR DELETE ON list_likes
    FOR EACH ROW EXECUTE FUNCTION update_list_likes_count();

DROP TRIGGER IF EXISTS item_likes_count_trigger ON item_likes;
CREATE TRIGGER item_likes_count_trigger
    AFTER INSERT OR DELETE ON item_likes
    FOR EACH ROW EXECUTE FUNCTION update_item_likes_count();

-- Grant permissions
GRANT ALL ON list_likes TO authenticated;
GRANT ALL ON item_likes TO authenticated;
GRANT ALL ON list_follows TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;