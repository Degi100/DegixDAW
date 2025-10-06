// ============================================
// APP LAYOUT COMPONENT
// corporate Theme - Global Layout with Header
// ============================================

import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChatSidebar from '../chat/ChatSidebar';
import { ChatProvider, useChat } from '../../contexts/ChatContext';
import { useConversations } from '../../hooks/useConversations';

function AppLayoutContent() {
  const { conversations } = useConversations();
  const { isChatOpen, closeChat, toggleChat } = useChat();

  const unreadChatCount = useMemo(() => {
    return conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
  }, [conversations]);

  return (
    <div className="app-layout">
      <Header
        onChatToggle={toggleChat}
        unreadChatCount={unreadChatCount}
      />
      <main className="app-main">
        <Outlet />
      </main>

      {/* Chat Sidebar */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={closeChat}
      />
    </div>
  );
}

export default function AppLayout() {
  return (
    <ChatProvider>
      <AppLayoutContent />
    </ChatProvider>
  );
}