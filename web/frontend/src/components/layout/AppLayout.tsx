// ============================================
// APP LAYOUT COMPONENT
// corporate Theme - Global Layout with Header
// ============================================

import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChatSidebar from '../chat/ChatSidebar';
import FloatingFileBrowserContainer from '../files/FloatingFileBrowserContainer';
import FileBrowser from '../files/FileBrowser';
import { ChatProvider, useChat } from '../../contexts/ChatContext';
import { FloatingFileBrowserProvider, useFloatingFileBrowserContext } from '../../contexts/FloatingFileBrowserContext';
import { useConversations } from '../../hooks/useConversations';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { canAccessFeature, getUserRole } from '../../lib/services/featureFlags';

function AppLayoutContent() {
  const { conversations, loadConversations, createOrOpenDirectConversation } = useConversations();
  const { isChatOpen, closeChat, toggleChat } = useChat();
  const floatingFileBrowser = useFloatingFileBrowserContext();
  const { isUserOnline } = useOnlineStatus();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useAdmin();
  const { features } = useFeatureFlags(); // Load features with Realtime

  // Get chat_sidebar feature
  const chatSidebarFeature = useMemo(
    () => features.find(f => f.id === 'chat_sidebar'),
    [features]
  );

  const userRole = user ? getUserRole(!!user, isAdmin, isModerator) : 'public';
  const canAccessChat = useMemo(
    () => canAccessFeature(chatSidebarFeature, userRole, isAdmin),
    [chatSidebarFeature, userRole, isAdmin]
  );

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

      {/* Floating File Browser - Persists across all routes */}
      {user && floatingFileBrowser.isFloating && (
        <FloatingFileBrowserContainer
          floatingState={floatingFileBrowser}
          onClose={() => floatingFileBrowser.setIsFloating(false)}
        >
          <FileBrowser userId={user.id} />
        </FloatingFileBrowserContainer>
      )}
    </div>
  );
}

export default function AppLayout() {
  return (
    <ChatProvider>
      <FloatingFileBrowserProvider>
        <AppLayoutContent />
      </FloatingFileBrowserProvider>
    </ChatProvider>
  );
}