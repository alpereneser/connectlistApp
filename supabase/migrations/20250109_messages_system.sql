-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text' NOT NULL,
    reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Add constraints
    CONSTRAINT messages_sender_receiver_different CHECK (sender_id != receiver_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'list_update', 'system', 'message')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Optional fields for actor and target
    actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID, -- Can reference lists, comments, etc.
    target_type VARCHAR(50), -- 'list', 'comment', 'user', etc.
    
    -- Optional metadata
    metadata JSONB
);

-- Create message_participants table for group conversations (future use)
CREATE TABLE IF NOT EXISTS message_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    is_admin BOOLEAN DEFAULT false NOT NULL,
    
    UNIQUE(conversation_id, user_id)
);

-- Create conversations table for group messaging (future use)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    is_group BOOLEAN DEFAULT false NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, read) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Add RLS (Row Level Security) policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Messages policies
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages they send" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own sent messages" ON messages
    FOR DELETE USING (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications for users" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification when message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification for new messages, not updates
    IF TG_OP = 'INSERT' THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            actor_id,
            target_id,
            target_type,
            metadata
        ) VALUES (
            NEW.receiver_id,
            'message',
            'New message',
            CASE 
                WHEN LENGTH(NEW.content) > 50 THEN SUBSTRING(NEW.content FROM 1 FOR 50) || '...'
                ELSE NEW.content
            END,
            NEW.sender_id,
            NEW.id,
            'message',
            jsonb_build_object(
                'message_id', NEW.id,
                'sender_id', NEW.sender_id
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for message notifications
CREATE TRIGGER create_message_notification_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION create_message_notification();

-- Function to get conversation partners and last messages
CREATE OR REPLACE FUNCTION get_user_conversations(user_uuid UUID)
RETURNS TABLE (
    participant_id UUID,
    participant_name TEXT,
    participant_username TEXT,
    participant_avatar TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    is_sender BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH conversation_messages AS (
        SELECT 
            CASE 
                WHEN m.sender_id = user_uuid THEN m.receiver_id
                ELSE m.sender_id 
            END as other_user_id,
            m.content,
            m.created_at,
            m.sender_id = user_uuid as is_outgoing,
            ROW_NUMBER() OVER (
                PARTITION BY 
                    CASE 
                        WHEN m.sender_id = user_uuid THEN m.receiver_id
                        ELSE m.sender_id 
                    END 
                ORDER BY m.created_at DESC
            ) as rn
        FROM messages m
        WHERE (m.sender_id = user_uuid OR m.receiver_id = user_uuid)
        AND m.deleted_at IS NULL
    ),
    unread_counts AS (
        SELECT 
            m.sender_id as other_user_id,
            COUNT(*) as unread_count
        FROM messages m
        WHERE m.receiver_id = user_uuid 
        AND m.read = false 
        AND m.deleted_at IS NULL
        GROUP BY m.sender_id
    )
    SELECT 
        cm.other_user_id,
        COALESCE(p.full_name, p.username, 'Unknown User') as participant_name,
        COALESCE(p.username, 'unknown') as participant_username,
        p.avatar_url as participant_avatar,
        cm.content as last_message,
        cm.created_at as last_message_time,
        COALESCE(uc.unread_count, 0) as unread_count,
        cm.is_outgoing as is_sender
    FROM conversation_messages cm
    LEFT JOIN profiles p ON p.id = cm.other_user_id
    LEFT JOIN unread_counts uc ON uc.other_user_id = cm.other_user_id
    WHERE cm.rn = 1
    ORDER BY cm.created_at DESC;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;