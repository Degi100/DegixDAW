import React, { useState } from 'react';
import type { Message } from '../../hooks/useMessages';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSender?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  showSender = false,
  onEdit,
  onDelete,
  onReact,
  onRemoveReaction,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || '');

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(!showContextMenu);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowContextMenu(false);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Nachricht löschen?')) {
      onDelete(message.id);
    }
    setShowContextMenu(false);
  };

  const handleReaction = (emoji: string) => {
    const existingReaction = message.reactions?.find(
      r => r.emoji === emoji && r.user_id === getCurrentUserId()
    );

    if (existingReaction && onRemoveReaction) {
      onRemoveReaction(message.id, emoji);
    } else if (onReact) {
      onReact(message.id, emoji);
    }
    setShowReactionPicker(false);
  };

  const getCurrentUserId = () => {
    // This should come from auth context in real implementation
    return message.sender_id; // Placeholder
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const groupReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return [];

    const grouped = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(
        reaction.user?.full_name || reaction.user?.username || 'User'
      );
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: string[] }>);

    return Object.values(grouped);
  };

  const renderTextMessage = () => {
    if (isEditing) {
      return (
        <div className="message-edit">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
            className="message-edit__input"
          />
          <div className="message-edit__actions">
            <button onClick={handleCancelEdit} className="btn-cancel">
              Abbrechen
            </button>
            <button onClick={handleSaveEdit} className="btn-save">
              Speichern
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="message-content">
        {message.content}
        {message.is_edited && <span className="message-edited"> (bearbeitet)</span>}
      </div>
    );
  };

  const renderImageMessage = () => {
    const attachment = message.attachments?.[0];
    if (!attachment) return null;

    return (
      <div className="message-media message-media--image">
        <img
          src={attachment.file_url}
          alt={attachment.file_name}
          loading="lazy"
          onClick={() => window.open(attachment.file_url, '_blank')}
        />
        {message.content && <div className="message-caption">{message.content}</div>}
      </div>
    );
  };

  const renderVideoMessage = () => {
    const attachment = message.attachments?.[0];
    if (!attachment) return null;

    return (
      <div className="message-media message-media--video">
        <video
          src={attachment.file_url}
          poster={attachment.thumbnail_url || undefined}
          controls
          preload="metadata"
        />
        {message.content && <div className="message-caption">{message.content}</div>}
      </div>
    );
  };

  const renderVoiceMessage = () => {
    const attachment = message.attachments?.[0];
    if (!attachment) return null;

    return (
      <div className="message-media message-media--voice">
        <div className="voice-message">
          <button className="voice-message__play">▶️</button>
          <div className="voice-message__waveform">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="voice-message__duration">
            {formatDuration(attachment.duration || 0)}
          </span>
        </div>
      </div>
    );
  };

  const renderFileMessage = () => {
    const attachment = message.attachments?.[0];
    if (!attachment) return null;

    return (
      <div className="message-media message-media--file">
        <a
          href={attachment.file_url}
          download={attachment.file_name}
          className="file-message"
        >
          <span className="file-message__icon">📎</span>
          <div className="file-message__info">
            <span className="file-message__name">{attachment.file_name}</span>
            <span className="file-message__size">{formatFileSize(attachment.file_size)}</span>
          </div>
          <span className="file-message__download">⬇️</span>
        </a>
      </div>
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderMessageContent = () => {
    if (message.is_deleted) {
      return (
        <div className="message-content message-deleted">
          <em>Diese Nachricht wurde gelöscht</em>
        </div>
      );
    }

    switch (message.message_type) {
      case 'image':
        return renderImageMessage();
      case 'video':
        return renderVideoMessage();
      case 'voice':
        return renderVoiceMessage();
      case 'file':
        return renderFileMessage();
      case 'text':
      default:
        return renderTextMessage();
    }
  };

  const groupedReactions = groupReactions();

  return (
    <div
      className={`message-bubble ${isOwnMessage ? 'message-bubble--sent' : 'message-bubble--received'}`}
      onContextMenu={handleContextMenu}
    >
      {/* Sender Name (für Gruppenchats) */}
      {showSender && !isOwnMessage && (
        <div className="message-sender">
          {message.sender?.full_name || message.sender?.username || 'User'}
        </div>
      )}

      {/* Message Content */}
      {renderMessageContent()}

      {/* Message Footer */}
      <div className="message-footer">
        <span className="message-time">{formatTime(message.created_at)}</span>
        {/* Gelesen-Status anzeigen */}
        {isOwnMessage ? (
          <span className="message-status">
            {message.read_receipts && message.read_receipts.length > 1 ? '✓✓' : '✓'}
          </span>
        ) : (
          <span className="message-status">
            {/* Zeige ✓ wenn die Nachricht vom aktuellen User gelesen wurde */}
            {message.read_receipts && message.read_receipts.some(r => r.user_id !== message.sender_id && r.read_at) ? '✓' : ''}
          </span>
        )}
      </div>

      {/* Reactions */}
      {groupedReactions.length > 0 && (
        <div className="message-reactions">
          {groupedReactions.map((reaction) => (
            <button
              key={reaction.emoji}
              className="message-reaction"
              title={reaction.users.join(', ')}
              onClick={() => handleReaction(reaction.emoji)}
            >
              <span className="message-reaction__emoji">{reaction.emoji}</span>
              {reaction.count > 1 && (
                <span className="message-reaction__count">{reaction.count}</span>
              )}
            </button>
          ))}
          <button
            className="message-reaction message-reaction--add"
            onClick={() => setShowReactionPicker(!showReactionPicker)}
          >
            +
          </button>
        </div>
      )}

      {/* Reaction Picker */}
      {showReactionPicker && (
        <div className="reaction-picker">
          {reactions.map((emoji) => (
            <button
              key={emoji}
              className="reaction-picker__emoji"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && isOwnMessage && !message.is_deleted && (
        <div className="message-context-menu">
          <button onClick={() => setShowReactionPicker(true)}>
            <span>😊</span> Reagieren
          </button>
          {message.message_type === 'text' && (
            <button onClick={handleEdit}>
              <span>✏️</span> Bearbeiten
            </button>
          )}
          <button onClick={handleDelete} className="danger">
            <span>🗑️</span> Löschen
          </button>
          <button onClick={() => setShowContextMenu(false)}>
            <span>✕</span> Abbrechen
          </button>
        </div>
      )}
    </div>
  );
};
