import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConversationList } from '../../components/social/ConversationList';
import { ChatWindow } from '../../components/social/ChatWindow';

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();

  return (
    <div className="chat-page">
      {/* Sidebar: Conversation List */}
      <aside className="chat-page__sidebar">
        <ConversationList activeConversationId={conversationId} />
      </aside>

      {/* Main: Chat Window */}
      <main className="chat-page__main">
        {conversationId ? (
          <ChatWindow conversationId={conversationId} />
        ) : (
          <div className="chat-page__empty">
            <div className="chat-page__empty-content">
              <span className="chat-page__empty-icon">💬</span>
              <h2>Wähle einen Chat</h2>
              <p>Wähle eine Konversation aus der Liste oder starte einen neuen Chat</p>
              <button
                className="chat-page__new-chat-btn"
                onClick={() => navigate('/chat/new')}
              >
                ✏️ Neuer Chat
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile: Back Button */}
      {conversationId && (
        <button
          className="chat-page__back"
          onClick={() => navigate('/chat')}
          aria-label="Zurück zur Liste"
        >
          ← Zurück
        </button>
      )}
    </div>
  );
};

export default ChatPage;
