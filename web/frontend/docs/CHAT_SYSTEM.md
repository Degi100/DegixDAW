# 💬 Chat System - Complete Documentation

**Version:** 1.0.0 (Realtime + Sounds + Presence)
**Last Updated:** 2025-10-28

## Übersicht

Das **Chat System** ist ein vollständiges Realtime-Messaging-System mit Supabase Realtime, Sound-Benachrichtigungen, Online-Status-Tracking und mehr.

---

## ✨ Features

### Aktuell Implementiert

#### 1. **💬 Realtime Messaging** ✅
   - Supabase Realtime für Live-Updates
   - Direct Messages (1-on-1)
   - Group Chats (Multi-User)
   - Message Types: Text, Image, Video, Voice, File
   - Unread Count + Read Receipts
   - Message Editing (is_edited flag)
   - Message Deletion (soft-delete with is_deleted flag)
   - Reply-to Messages (reply_to_id)

#### 2. **🔊 Chat Sound System** ✅
   - Toggle Button im Header (🔊/🔇)
   - LocalStorage Persistence
   - Web Audio API (synthesized sounds, keine MP3s!)
   - 5 verschiedene Sounds:
     - `playMessageReceived()` - Sanfter Bell (523Hz + 659Hz Chord)
     - `playMessageSent()` - Whoosh (800Hz → 400Hz)
     - `playNewChat()` - Ding (440Hz + 554Hz + 659Hz Chord)
     - `playChatOpen()` - Subtle Open (600Hz)
     - `playChatClose()` - Subtle Close (400Hz)
   - Default: Sounds OFF (user-freundlich!)

#### 3. **🟢 Online Status / Presence** ✅
   - Supabase Realtime Presence API
   - Channel: `online-users`
   - Hook: `useOnlineStatus()`
   - Automatic Tracking (Join/Leave Events)
   - Functions:
     - `isUserOnline(userId)` - Check if user online
     - `onlineUsers` Map<userId, boolean>
   - **ABER:** UI Integration fehlt! (Kein 🟢 Badge in User-Liste)

#### 4. **📌 Pinned Conversations** ✅
   - `conversations.is_pinned` Column
   - Pinned Conversations werden oben sortiert
   - Sort Logic in ConversationList.tsx (Zeile 32-41)
   - **ABER:** Kein Pin/Unpin Button in UI!
   - **ABER:** Pinned MESSAGES (nicht Conversations) fehlt komplett!

#### 5. **📂 File Attachments** ✅
   - Upload: Images, Audio, Video, Documents
   - Supabase Storage: `chat-attachments` Bucket
   - Max Size: 5 MB pro File
   - Drag & Drop Support
   - Preview für Images
   - Table: `message_attachments`

#### 6. **🎤 Speech-to-Text** ✅
   - Web Speech API (Browser-native)
   - 40+ Sprachen unterstützt
   - 🎤 Button im Chat-Input
   - Genauigkeit Browser-abhängig (Chrome am besten)

#### 7. **Chat Sidebar** ✅
   - Collapsible Sidebar (kann eingeklappt werden)
   - Feature Flag: `chat_sidebar` (Admin-only default)
   - Unread Count Badge
   - Animation bei neuer Nachricht
   - Conversation List mit Search

---

## 🏗️ Architektur

### Datenbank Schema

#### **messages Tabelle**

```sql
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

-- Indexes
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_reply_to_id ON public.messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
```

#### **conversations Tabelle**

```sql
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,  -- For group chats
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  avatar_url TEXT,
  is_pinned BOOLEAN DEFAULT false,  -- ✅ Pinned Conversations
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversations_is_pinned ON public.conversations(is_pinned) WHERE is_pinned = true;
```

#### **conversation_members Tabelle**

```sql
CREATE TABLE IF NOT EXISTS public.conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX idx_conversation_members_conversation_id ON public.conversation_members(conversation_id);
CREATE INDEX idx_conversation_members_user_id ON public.conversation_members(user_id);
```

#### **message_attachments Tabelle**

```sql
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- Supabase Storage path
  file_type TEXT NOT NULL,   -- MIME type
  file_size BIGINT,          -- Bytes
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_message_attachments_message_id ON public.message_attachments(message_id);
```

---

### Komponenten-Struktur

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatSidebar.tsx                 # Main Sidebar Component (214 LOC - refactored!)
│   │   ├── ChatWindow.tsx                  # Chat Window with Messages
│   │   ├── ChatInput.tsx                   # Message Input + Speech-to-Text
│   │   ├── MessageItem.tsx                 # Single Message Display
│   │   ├── ChatItem.tsx                    # Conversation List Item
│   │   └── SidebarHeader.tsx               # Sidebar Header with Actions
│   └── social/
│       ├── ConversationList.tsx            # Conversation List with Search & Pinned Sort
│       └── ChatWindow.tsx                  # Social Page Chat Window
├── hooks/
│   ├── useMessages.ts                      # Messages CRUD + Realtime
│   ├── useConversations.ts                 # Conversations CRUD
│   ├── useOnlineStatus.ts                  # 🟢 Online Status Tracking
│   ├── useChatSounds.ts                    # 🔊 (exported from chatSounds.ts)
│   └── useMessageSubscriptions.ts          # Realtime Message Subscriptions
├── lib/
│   └── sounds/
│       └── chatSounds.ts                   # 🔊 Chat Sound Manager (Web Audio API)
└── styles/
    └── components/chat/
        ├── _chat-sidebar.scss
        ├── _chat-window.scss
        └── _message-item.scss
```

---

## 📊 Code Examples

### 1. Sound System Usage

```tsx
// Header.tsx - Sound Toggle
import { useChatSounds } from '../../lib/sounds/chatSounds';

export default function Header() {
  const { setEnabled: setSoundsEnabled } = useChatSounds();
  const [soundsEnabled, setSoundsEnabledState] = useState(() => {
    const saved = localStorage.getItem('soundsEnabled');
    return saved !== null ? saved === 'true' : false; // Default: OFF
  });

  const handleSoundToggle = useCallback(() => {
    const newState = !soundsEnabled;
    setSoundsEnabledState(newState);
    setSoundsEnabled(newState);
    localStorage.setItem('soundsEnabled', String(newState));
  }, [soundsEnabled, setSoundsEnabled]);

  return (
    <button
      className="sound-toggle"
      onClick={handleSoundToggle}
      title={`Sounds ${soundsEnabled ? 'aus' : 'ein'}schalten`}
    >
      {soundsEnabled ? '🔊' : '🔇'}
    </button>
  );
}
```

```tsx
// ChatWindow.tsx - Play Sound on New Message
import { useChatSounds } from '../../lib/sounds/chatSounds';

export default function ChatWindow() {
  const { playMessageReceived } = useChatSounds();

  useEffect(() => {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', table: 'messages' }, (payload) => {
        if (payload.new.sender_id !== currentUserId) {
          playMessageReceived(); // Play sound for incoming messages
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);
}
```

---

### 2. Online Status Usage

```tsx
// useOnlineStatus.ts - Hook Implementation
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useOnlineStatus() {
  const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newOnlineUsers = new Map<string, boolean>();
        Object.keys(state).forEach((userId) => {
          newOnlineUsers.set(userId, true);
        });
        setOnlineUsers(newOnlineUsers);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers((prev) => new Map(prev).set(key as string, true));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers((prev) => {
          const newMap = new Map(prev);
          newMap.delete(key as string);
          return newMap;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => channel.unsubscribe();
  }, [currentUserId]);

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
  };

  return { onlineUsers, isUserOnline };
}
```

```tsx
// ConversationList.tsx - Usage (NOT YET IMPLEMENTED!)
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function ConversationList() {
  const { isUserOnline } = useOnlineStatus();

  return (
    <div className="conversation-item">
      <div className="avatar">
        <img src={avatar} />
        {/* TODO: Add Online Badge! */}
        {isUserOnline(userId) && <span className="online-badge">🟢</span>}
      </div>
    </div>
  );
}
```

---

### 3. Pinned Conversations Sort

```tsx
// ConversationList.tsx - Sorting Logic (Lines 32-41)
const sortedConversations = [...filteredConversations].sort((a, b) => {
  // Pinned first
  if (a.isPinned && !b.isPinned) return -1;
  if (!a.isPinned && b.isPinned) return 1;

  // Then by last_message_at
  const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
  const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
  return dateB - dateA;
});
```

---

## 🎯 Use Cases

### Use Case 1: Producer teilt Track Preview
1. Producer uploaded Track in Project
2. Öffnet Chat mit Band
3. Schreibt: "Check mal den neuen Drop! 🔥"
4. Band-Mitglieder sehen 🟢 Online-Status
5. Klicken auf Message → Sound spielt ab
6. Antworten im Chat mit Feedback

### Use Case 2: Kollaboration mit Sound Notifications
1. Singer arbeitet an Lyrics (Sounds ON)
2. Producer schreibt Message: "Kannst du Melodie höher singen?"
3. Singer hört Sound-Notification (🔊)
4. Liest Message → Antwortet
5. Producer hört "Message Sent" Whoosh-Sound

### Use Case 3: Wichtige Messages pinnen
1. Producer schreibt: "Session am Freitag 18:00 Uhr!"
2. Producer pinnt Conversation
3. Conversation bleibt oben in Liste (auch nach neuen Messages in anderen Chats)

---

## ❌ Was FEHLT (To-Do)

### 1. **Online Badge UI** (30 Min)
- Component: `OnlineBadge.tsx` erstellen
- Integration: ConversationList + ChatWindow Member-Liste
- Styling: Green dot (🟢) oder Custom CSS

### 2. **Typing Indicator** (1h)
- Hook: `useTypingIndicator(conversationId)` erstellen
- Presence: Erweitere Supabase Presence für Typing-State
- UI: "User is typing..." unter Chat-Input
- Animation: Drei bouncing dots (...)

### 3. **Pinned Messages** (1-2h)
- SQL: `ALTER TABLE messages ADD COLUMN is_pinned BOOLEAN DEFAULT false`
- Hook: `usePinnedMessages(conversationId)`
- UI: Pin/Unpin Button im Message Context Menu
- UI: Pinned Section oben im Chat
- Index: `CREATE INDEX idx_messages_pinned ON messages(conversation_id, is_pinned) WHERE is_pinned = true`

### 4. **Message Reactions** (2h)
- Table: `message_reactions` (message_id, user_id, emoji)
- UI: Reaction Picker (😀👍❤️🔥🎵)
- Display: Reaction Count unter Message
- Realtime: Live-Updates bei neuen Reactions

### 5. **Voice Messages** (2-3h)
- Record Audio via Web Audio API
- Upload to Supabase Storage
- Waveform Display
- Playback Controls

### 6. **Read Receipts UI** (1h)
- "Seen by X users" unter Message
- Checkmarks: ✓ Sent, ✓✓ Delivered, ✓✓ Read
- List: "Seen by Alice, Bob, Charlie"

---

## 🐛 Known Issues

### Issue 1: Online Status UI fehlt
**Problem:** Hook `useOnlineStatus()` existiert, aber kein 🟢 Badge in UI!

**Solution:** Component erstellen + in ConversationList integrieren (siehe "Was FEHLT #1")

---

### Issue 2: Pinned Conversations kein UI-Button
**Problem:** `is_pinned` Column existiert, aber kein Button zum Pinnen!

**Solution:** Context Menu für Conversations mit Pin/Unpin Action

---

### Issue 3: Sound bei eigenem Message
**Problem:** `playMessageSent()` wird nicht immer getriggert

**Solution:** Ensure sound plays in `sendMessage()` function after successful send

---

## 📚 API Reference

### useChatSounds() Hook

```typescript
interface UseChatSoundsReturn {
  playMessageReceived: () => Promise<void>;
  playMessageSent: () => Promise<void>;
  playNewChat: () => Promise<void>;
  playChatOpen: () => Promise<void>;
  playChatClose: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  isEnabled: () => boolean;
}
```

### useOnlineStatus() Hook

```typescript
interface UseOnlineStatusReturn {
  onlineUsers: Map<string, boolean>;
  isUserOnline: (userId: string) => boolean;
}
```

---

## 🔒 Security (RLS Policies)

### Messages RLS

```sql
-- Users can view messages in their conversations
CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

-- Users can insert messages in their conversations
CREATE POLICY "Users can insert own messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_members
      WHERE conversation_id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

-- Users can update own messages (edit)
CREATE POLICY "Users can update own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());
```

---

## 🎨 Styling

### Sound Toggle Button

```scss
// Header.scss
.sound-toggle {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.5rem;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}
```

### Online Badge

```scss
// ConversationList.scss (TO-DO!)
.online-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #10b981; // Green
  border: 2px solid var(--color-bg-primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 📝 Changelog

### v1.0.0 (2025-10-28) - Initial Documentation
- ✅ Documented Chat Sound System (Web Audio API)
- ✅ Documented Online Status Hook (Supabase Presence)
- ✅ Documented Pinned Conversations (Sort Logic)
- ✅ Documented Database Schema (messages, conversations, attachments)
- ✅ Documented Code Locations (Components, Hooks, Services)
- ✅ Added Use Cases & Examples
- ✅ Added "What's Missing" Section (Online Badge, Typing, Pinned Messages)

---

**Status:** ✅ **Core Features Complete** (Sound, Online Status, Pinned Conversations)
**Next Milestone:** Online Badge UI + Typing Indicator (Quick Wins!)
**Future:** Voice Messages, Reactions, Video Calls

**Maintainer:** DegixDAW Team
