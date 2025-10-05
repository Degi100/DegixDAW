// ============================================
// APP LAYOUT COMPONENT
// corporate Theme - Global Layout with Header
// ============================================

import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import ChatSidebar from '../chat/ChatSidebar';

export default function AppLayout() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount] = useState(8); // Mock unread count

  const handleChatToggle = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const handleChatClose = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  return (
    <div className="app-layout">
      <Header 
        onChatToggle={handleChatToggle}
        unreadChatCount={unreadChatCount}
      />
      <main className="app-main">
        <Outlet />
      </main>
      
      {/* Chat Sidebar */}
      <ChatSidebar 
        isOpen={isChatOpen}
        onClose={handleChatClose}
      />
    </div>
  );
}