import React, { memo, forwardRef, useState } from 'react';
import type { Message } from '../../hooks/useMessages';

interface ChatMessageProps {
  message: Message;
  currentUserId: string | null;
}

const ChatMessage = memo(forwardRef<HTMLDivElement, ChatMessageProps>(({ message, currentUserId }, ref) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  // Memoize the time formatting to avoid recalculating on every render
  const timeStr = React.useMemo(() => {
    const msgDate = new Date(message.created_at);
    return msgDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }, [message.created_at]);

  const isSent = message.sender_id === currentUserId;
  const hasAttachments = message.attachments && message.attachments.length > 0;

  // Helper: Determine file type category
  const getFileCategory = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  };

  return (
    <div className={`chat-history-msg ${isSent ? 'sent' : 'received'}`} ref={ref}>
      <div className="chat-history-msg-bubble">
        {/* Text Content */}
        {message.content && (
          <div className="chat-history-msg-content">{message.content}</div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div className="chat-attachments">
            {message.attachments?.map((attachment) => {
              const category = getFileCategory(attachment.file_type);
              
              if (category === 'image' && !imageError) {
                return (
                  <div key={attachment.id} className="chat-attachment chat-attachment--image">
                    <img
                      src={attachment.thumbnail_url || attachment.file_url}
                      alt={attachment.file_name}
                      className="chat-attachment-preview"
                      onClick={() => setShowFullImage(true)}
                      onError={() => setImageError(true)}
                      loading="lazy"
                    />
                    {showFullImage && (
                      <div 
                        className="chat-image-lightbox" 
                        onClick={() => setShowFullImage(false)}
                      >
                        <img src={attachment.file_url} alt={attachment.file_name} />
                        <button className="chat-lightbox-close">✕</button>
                      </div>
                    )}
                  </div>
                );
              }

              if (category === 'video') {
                return (
                  <div key={attachment.id} className="chat-attachment chat-attachment--video">
                    <video 
                      controls 
                      className="chat-attachment-preview"
                      poster={attachment.thumbnail_url || undefined}
                    >
                      <source src={attachment.file_url} type={attachment.file_type} />
                      Dein Browser unterstützt keine Videos.
                    </video>
                  </div>
                );
              }

              if (category === 'audio') {
                return (
                  <div key={attachment.id} className="chat-attachment chat-attachment--audio">
                    <audio controls className="chat-attachment-audio">
                      <source src={attachment.file_url} type={attachment.file_type} />
                      Dein Browser unterstützt keine Audios.
                    </audio>
                    <span className="chat-attachment-name">🎵 {attachment.file_name}</span>
                  </div>
                );
              }

              // Generic file download
              return (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-attachment chat-attachment--file"
                  download={attachment.file_name}
                >
                  <span className="chat-attachment-icon">📄</span>
                  <span className="chat-attachment-name">{attachment.file_name}</span>
                  {attachment.file_size && (
                    <span className="chat-attachment-size">
                      {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        )}

        {/* Meta */}
        <div className="chat-history-msg-meta">
          <span className="chat-history-msg-time">{timeStr}</span>
          {isSent && (
            <span className={`chat-history-msg-status ${message.read_receipts && message.read_receipts.length > 0 ? 'read' : 'sent'}`}>
              {(message.read_receipts && message.read_receipts.length > 0) ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}));

ChatMessage.displayName = 'ChatMessage';

export default ChatMessage;