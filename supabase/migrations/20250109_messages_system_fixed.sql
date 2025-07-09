-- Add missing columns to existing messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_status jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Add missing columns to existing notifications table  
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS message text,
ADD COLUMN IF NOT EXISTS read boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES public.users_profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS target_id uuid,
ADD COLUMN IF NOT EXISTS target_type varchar(50),
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Update notifications table to use consistent naming
UPDATE public.notifications SET message = body WHERE message IS NULL;
UPDATE public.notifications SET read = is_read WHERE read IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);

-- Add RLS policies if not exist
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their conversations_access" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

-- Messages policies (updated for conversation-based system)
CREATE POLICY "Users can view their conversations" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = messages.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their messages" ON public.messages
    FOR UPDATE USING (auth.uid() = sender_id);

-- Conversations policies
CREATE POLICY "Users can view their conversations_access" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = conversations.id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (true);

-- Conversation participants policies
CREATE POLICY "Users can view conversation participants" ON public.conversation_participants
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp 
            WHERE cp.conversation_id = conversation_participants.conversation_id 
            AND cp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join conversations" ON public.conversation_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies (update existing)
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Function to get user conversations with last message and unread count
CREATE OR REPLACE FUNCTION get_user_conversations(user_uuid UUID)
RETURNS TABLE (
    conversation_id UUID,
    participant_id UUID,
    participant_name TEXT,
    participant_username TEXT,
    participant_avatar TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    last_sender_id UUID,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_conversations AS (
        SELECT DISTINCT cp.conversation_id
        FROM public.conversation_participants cp
        WHERE cp.user_id = user_uuid
    ),
    conversation_info AS (
        SELECT 
            uc.conversation_id,
            -- Get the other participant (assuming 2-person conversations)
            (SELECT cp2.user_id 
             FROM public.conversation_participants cp2 
             WHERE cp2.conversation_id = uc.conversation_id 
             AND cp2.user_id != user_uuid 
             LIMIT 1) as other_user_id
        FROM user_conversations uc
    ),
    last_messages AS (
        SELECT 
            m.conversation_id,
            m.content as last_message,
            m.created_at as last_message_time,
            m.sender_id as last_sender_id,
            ROW_NUMBER() OVER (PARTITION BY m.conversation_id ORDER BY m.created_at DESC) as rn
        FROM public.messages m
        WHERE m.conversation_id IN (SELECT conversation_id FROM user_conversations)
        AND m.deleted_at IS NULL
    ),
    unread_counts AS (
        SELECT 
            m.conversation_id,
            COUNT(*) as unread_count
        FROM public.messages m
        WHERE m.conversation_id IN (SELECT conversation_id FROM user_conversations)
        AND m.sender_id != user_uuid
        AND (
            m.read_status->user_uuid::text IS NULL OR 
            (m.read_status->user_uuid::text)::boolean = false
        )
        AND m.deleted_at IS NULL
        GROUP BY m.conversation_id
    )
    SELECT 
        ci.conversation_id,
        ci.other_user_id as participant_id,
        COALESCE(p.full_name, p.username, 'Unknown User') as participant_name,
        COALESCE(p.username, 'unknown') as participant_username,
        p.avatar_url as participant_avatar,
        COALESCE(lm.last_message, '') as last_message,
        lm.last_message_time,
        lm.last_sender_id,
        COALESCE(uc.unread_count, 0) as unread_count
    FROM conversation_info ci
    LEFT JOIN public.users_profiles p ON p.id = ci.other_user_id
    LEFT JOIN last_messages lm ON lm.conversation_id = ci.conversation_id AND lm.rn = 1
    LEFT JOIN unread_counts uc ON uc.conversation_id = ci.conversation_id
    WHERE ci.other_user_id IS NOT NULL
    ORDER BY lm.last_message_time DESC NULLS LAST;
END;
$$ language 'plpgsql';

-- Function to create or get conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    conv_id UUID;
BEGIN
    -- Try to find existing conversation between these two users
    SELECT c.id INTO conv_id
    FROM public.conversations c
    WHERE EXISTS (
        SELECT 1 FROM public.conversation_participants cp1 
        WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
    )
    AND EXISTS (
        SELECT 1 FROM public.conversation_participants cp2 
        WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
    )
    AND (
        SELECT COUNT(*) FROM public.conversation_participants cp 
        WHERE cp.conversation_id = c.id
    ) = 2
    LIMIT 1;

    -- If no conversation exists, create one
    IF conv_id IS NULL THEN
        INSERT INTO public.conversations (created_at, updated_at, last_message_at)
        VALUES (NOW(), NOW(), NOW())
        RETURNING id INTO conv_id;

        -- Add both participants
        INSERT INTO public.conversation_participants (conversation_id, user_id, joined_at)
        VALUES 
            (conv_id, user1_id, NOW()),
            (conv_id, user2_id, NOW());
    END IF;

    RETURN conv_id;
END;
$$ language 'plpgsql';

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(conv_id UUID, user_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.messages 
    SET read_status = COALESCE(read_status, '{}'::jsonb) || jsonb_build_object(user_uuid::text, true),
        updated_at = NOW()
    WHERE conversation_id = conv_id 
    AND sender_id != user_uuid
    AND (
        read_status->user_uuid::text IS NULL OR 
        (read_status->user_uuid::text)::boolean = false
    );
END;
$$ language 'plpgsql';

-- Function to create notification when message is sent
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
BEGIN
    -- Get all participants except sender
    FOR recipient_id IN 
        SELECT cp.user_id 
        FROM public.conversation_participants cp
        WHERE cp.conversation_id = NEW.conversation_id 
        AND cp.user_id != NEW.sender_id
    LOOP
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            message,
            actor_id,
            target_id,
            target_type,
            data,
            metadata
        ) VALUES (
            recipient_id,
            'message',
            'New message',
            CASE 
                WHEN LENGTH(NEW.content) > 50 THEN SUBSTRING(NEW.content FROM 1 FOR 50) || '...'
                ELSE NEW.content
            END,
            CASE 
                WHEN LENGTH(NEW.content) > 50 THEN SUBSTRING(NEW.content FROM 1 FOR 50) || '...'
                ELSE NEW.content
            END,
            NEW.sender_id,
            NEW.id,
            'message',
            jsonb_build_object(
                'message_id', NEW.id,
                'conversation_id', NEW.conversation_id,
                'sender_id', NEW.sender_id
            ),
            jsonb_build_object(
                'message_id', NEW.id,
                'conversation_id', NEW.conversation_id,
                'sender_id', NEW.sender_id
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for message notifications
DROP TRIGGER IF EXISTS create_message_notification_trigger ON public.messages;
CREATE TRIGGER create_message_notification_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION create_message_notification();

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations 
    SET 
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for conversation timestamp update
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON public.messages;
CREATE TRIGGER update_conversation_timestamp_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;