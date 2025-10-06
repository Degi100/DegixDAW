import React from 'react';
import ChatItem from './ChatItem';
import type { ChatItemProps } from './ChatItem';

interface ChatListProps {
  chats: ChatItemProps[];
  selectedChatId: string | null;
  onSelect: (chatId: string) => void;
  expandedChatId: string | null;
  children?: React.ReactNode;
}

export default function ChatList({ chats, selectedChatId, onSelect, expandedChatId, children }: ChatListProps) {

  if (chats.length === 0) {
    return (
      <div className="chat-list">
        <div className="chat-empty">
          <span>💬</span>
          <p>Noch keine Chats</p>
          <p>Starte eine Unterhaltung!</p>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="chat-list">
      {chats.map(chat => (
        <div key={chat.id}>
          <ChatItem
            {...chat}
            selected={selectedChatId === chat.id}
            onClick={onSelect}
          />
          {expandedChatId === chat.id && children}
        </div>
      ))}
    </div>
  );
}
