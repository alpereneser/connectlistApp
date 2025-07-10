-- Add reply support to list_comments table
-- Add parent_id column to enable comment replies

-- Add parent_id column to list_comments table
ALTER TABLE list_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES list_comments(id) ON DELETE CASCADE;

-- Create index for better performance when fetching replies
CREATE INDEX IF NOT EXISTS idx_list_comments_parent_id ON list_comments(parent_id);

-- Create index for better performance when fetching comments by list
CREATE INDEX IF NOT EXISTS idx_list_comments_list_id ON list_comments(list_id);

-- Update the function to handle reply counts if needed
-- For now, we'll keep it simple and just count all comments regardless of nesting