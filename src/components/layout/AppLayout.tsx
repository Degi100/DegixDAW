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
  const { conversations, loadConversations, createOrOpenDirectConversation } = useConversations();
  const { isChatOpen, closeChat, toggleChat } = useChat();

  const unreadChatCount = useMemo(() => {
    console.log('🔢 Calculating unreadChatCount, conversations:', conversations.length);
    const count = conversations.reduce((total, conv) => {
      const unread = conv.unreadCount || 0;
      if (unread > 0) {
        console.log(`  📩 Conv ${conv.id}: ${unread} unread`);
      }
      return total + unread;
    }, 0);
    console.log('🎯 Total unreadChatCount:', count);
    return count;
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

      {/* Chat Sidebar - pass conversations to avoid duplicate subscriptions */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={closeChat}
        conversations={conversations}
        loadConversations={loadConversations}
        createOrOpenDirectConversation={createOrOpenDirectConversation}
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