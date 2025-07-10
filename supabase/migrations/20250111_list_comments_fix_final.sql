-- Final fix for list_comments table
-- The issue was that list_comments table was referencing auth.users instead of users_profiles
-- and the RLS policies were not correctly configured

-- First, drop existing table and policies
DROP TABLE IF EXISTS list_comments CASCADE;

-- Create list_comments table with correct structure
CREATE TABLE list_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE list_comments ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
-- Since users_profiles.id is the same as auth.uid(), we can use auth.uid() directly
CREATE POLICY "Users can view all list comments" ON list_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON list_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON list_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON list_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update list comments count
CREATE OR REPLACE FUNCTION update_list_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE lists SET comments_count = comments_count + 1 WHERE id = NEW.list_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE lists SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.list_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating comments count
DROP TRIGGER IF EXISTS list_comments_count_trigger ON list_comments;
CREATE TRIGGER list_comments_count_trigger
    AFTER INSERT OR DELETE ON list_comments
    FOR EACH ROW EXECUTE FUNCTION update_list_comments_count();

-- Grant permissions
GRANT ALL ON list_comments TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;