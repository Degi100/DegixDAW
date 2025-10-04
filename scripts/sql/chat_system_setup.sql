-- ============================================
-- CHAT SYSTEM v1.0 - Database Setup
-- ============================================
-- WhatsApp-Style Messaging System mit allen Features

-- ============================================
-- 1. CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  name TEXT, -- Nur für Gruppen, NULL für Direct Chats
  description TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false
);

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations(created_by);

-- ============================================
-- 2. CONVERSATION_MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Unique: Ein User kann nur einmal Member einer Conversation sein
  UNIQUE(conversation_id, user_id)
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON public.conversation_members(conversation_id);

-- ============================================
-- 3. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice', 'file')),
  
  -- Message Status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Reply to another message
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes für Performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- 4. MESSAGE_ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- image/jpeg, video/mp4, audio/webm, etc.
  file_size BIGINT, -- in bytes
  thumbnail_url TEXT, -- für Videos/Bilder
  duration INTEGER, -- für Voice/Video in Sekunden
  width INTEGER, -- für Bilder/Videos
  height INTEGER, -- für Bilder/Videos
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments(message_id);

-- ============================================
-- 5. MESSAGE_REACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL, -- 👍, ❤️, 😂, 😮, 😢, 🙏
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ein User kann nur einmal mit dem gleichen Emoji reagieren
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- ============================================
-- 6. MESSAGE_READ_RECEIPTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  
  -- Ein User kann nur einen Read Receipt pro Message haben
  UNIQUE(message_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON public.message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON public.message_read_receipts(user_id);

-- ============================================
-- 7. TYPING_INDICATORS TABLE (für "XY schreibt...")
-- ============================================
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ein User kann nur einmal typing indicator haben pro Conversation
  UNIQUE(conversation_id, user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_typing_indicators_conversation_id ON public.typing_indicators(conversation_id);

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- CONVERSATIONS: Nur Members können sehen
CREATE POLICY "Users can view conversations they are member of"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversations.id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation admins can update"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversations.id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

-- CONVERSATION_MEMBERS: Members können sehen
CREATE POLICY "Users can view members of their conversations"
  ON public.conversation_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can add members"
  ON public.conversation_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
    OR
    -- Oder für Direct Chats: Creator kann Members hinzufügen
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_members.conversation_id
        AND c.created_by = auth.uid()
        AND c.type = 'direct'
    )
  );

CREATE POLICY "Users can leave conversations"
  ON public.conversation_members FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their membership"
  ON public.conversation_members FOR UPDATE
  USING (user_id = auth.uid());

-- MESSAGES: Members können sehen und senden
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  USING (sender_id = auth.uid());

-- MESSAGE_ATTACHMENTS: Follow message permissions
CREATE POLICY "Users can view attachments of messages they can see"
  ON public.message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_attachments.message_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add attachments to their messages"
  ON public.message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_attachments.message_id
        AND m.sender_id = auth.uid()
    )
  );

-- MESSAGE_REACTIONS: Everyone in conversation can react
CREATE POLICY "Users can view reactions in their conversations"
  ON public.message_reactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add reactions"
  ON public.message_reactions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_reactions.message_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own reactions"
  ON public.message_reactions FOR DELETE
  USING (user_id = auth.uid());

-- MESSAGE_READ_RECEIPTS: Users can manage their own
CREATE POLICY "Users can view read receipts"
  ON public.message_read_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_members cm ON cm.conversation_id = m.conversation_id
      WHERE m.id = message_read_receipts.message_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own read receipts"
  ON public.message_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own read receipts"
  ON public.message_read_receipts FOR UPDATE
  USING (user_id = auth.uid());

-- TYPING_INDICATORS: Everyone in conversation can see
CREATE POLICY "Users can view typing indicators in their conversations"
  ON public.typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members cm
      WHERE cm.conversation_id = typing_indicators.conversation_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own typing indicators"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own typing indicators"
  ON public.typing_indicators FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 9. TRIGGERS für updated_at
-- ============================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger für messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_read_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- ============================================
-- 11. VERIFY SETUP
-- ============================================
SELECT 
  'conversations' as table_name,
  COUNT(*) as count
FROM public.conversations
UNION ALL
SELECT 'conversation_members', COUNT(*) FROM public.conversation_members
UNION ALL
SELECT 'messages', COUNT(*) FROM public.messages
UNION ALL
SELECT 'message_attachments', COUNT(*) FROM public.message_attachments
UNION ALL
SELECT 'message_reactions', COUNT(*) FROM public.message_reactions
UNION ALL
SELECT 'message_read_receipts', COUNT(*) FROM public.message_read_receipts
UNION ALL
SELECT 'typing_indicators', COUNT(*) FROM public.typing_indicators;

-- Verify Realtime
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename LIKE '%conversation%' OR tablename LIKE '%message%' OR tablename = 'typing_indicators'
ORDER BY tablename;

-- ============================================
-- FERTIG! 🎉
-- ============================================
-- 7 Tabellen erstellt
-- RLS Policies aktiviert
-- Realtime aktiviert
-- Performance Indexes erstellt
-- Bereit für WhatsApp-Style Chat! 💬
-- ============================================
