-- Fix list_comments table foreign key reference
-- The issue is that list_comments should reference users_profiles instead of auth.users

-- First, check if list_comments table exists and drop it if it has wrong references
DROP TABLE IF EXISTS list_comments CASCADE;

-- Create list_comments table with correct reference to users_profiles
CREATE TABLE list_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users_profiles(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on list_comments
ALTER TABLE list_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for list_comments
CREATE POLICY "Users can view all list comments" ON list_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON list_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE users_profiles.id = list_comments.user_id 
            AND users_profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own comments" ON list_comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE users_profiles.id = list_comments.user_id 
            AND users_profiles.id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own comments" ON list_comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users_profiles 
            WHERE users_profiles.id = list_comments.user_id 
            AND users_profiles.id = auth.uid()
        )
    );

-- Create or replace function to update list comments count
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

-- Create trigger for list comments count
DROP TRIGGER IF EXISTS list_comments_count_trigger ON list_comments;
CREATE TRIGGER list_comments_count_trigger
    AFTER INSERT OR DELETE ON list_comments
    FOR EACH ROW EXECUTE FUNCTION update_list_comments_count();

-- Grant permissions
GRANT ALL ON list_comments TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;