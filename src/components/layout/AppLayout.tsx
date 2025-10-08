// ============================================
// APP LAYOUT COMPONENT
// corporate Theme - Global Layout with Header
// ============================================

import { useMemo, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChatSidebar from '../chat/ChatSidebar';
import { ChatProvider, useChat } from '../../contexts/ChatContext';
import { useConversations } from '../../hooks/useConversations';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { canAccessFeature, getUserRole } from '../../lib/constants/featureFlags';

function AppLayoutContent() {
  const { conversations, loadConversations, createOrOpenDirectConversation } = useConversations();
  const { isChatOpen, closeChat, toggleChat } = useChat();
  const { isUserOnline } = useOnlineStatus();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useAdmin();
  const [featureFlagVersion, setFeatureFlagVersion] = useState(0);

  useEffect(() => {
    const handleFlagsChanged = () => {
      setFeatureFlagVersion(prev => prev + 1);
    };

    window.addEventListener('featureFlagsChanged', handleFlagsChanged);
    return () => {
      window.removeEventListener('featureFlagsChanged', handleFlagsChanged);
    };
  }, []);

  const userRole = user ? getUserRole(isAdmin, isModerator) : 'public';
  const canAccessChat = useMemo(() => canAccessFeature('chat_sidebar', userRole, isAdmin), [userRole, isAdmin, featureFlagVersion]);

  const unreadChatCount = useMemo(() => {
    if (!canAccessChat) return 0;
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
  }, [conversations, canAccessChat]);

  return (
    <div className="app-layout">
      <Header
        onChatToggle={canAccessChat ? toggleChat : undefined}
        unreadChatCount={unreadChatCount}
        // Pass the version to force Header to re-render
        key={featureFlagVersion}
      />
      <main className="app-main">
        <Outlet />
      </main>

      {/* Chat Sidebar - Render only if feature is enabled */}
      {canAccessChat && (
        <ChatSidebar
          isOpen={isChatOpen}
          onClose={closeChat}
          conversations={conversations}
          loadConversations={loadConversations}
          createOrOpenDirectConversation={createOrOpenDirectConversation}
          isUserOnline={isUserOnline}
        />
      )}
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