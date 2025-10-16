// src/components/chat/ChatAttachment.tsx
// Component for rendering chat attachments with signed URLs

import React, { useState } from 'react';
import { useSignedUrl } from '../../hooks/useSignedUrl';

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size?: number | null;
  thumbnail_url?: string | null;
}

interface ChatAttachmentProps {
  attachment: Attachment;
}

export const ChatAttachment: React.FC<ChatAttachmentProps> = ({ attachment }) => {
  const [imageError, setImageError] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  // Generate signed URLs for storage paths
  const fileUrl = useSignedUrl(attachment.file_url);
  const thumbnailUrl = useSignedUrl(attachment.thumbnail_url);

  // Determine file category
  const getFileCategory = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const category = getFileCategory(attachment.file_type);

  // Image attachment
  if (category === 'image' && !imageError) {
    return (
      <div className="chat-attachment chat-attachment--image">
        {thumbnailUrl || fileUrl ? (
          <>
            <img
              src={thumbnailUrl || fileUrl || ''}
              alt={attachment.file_name}
              className="chat-attachment-preview"
              onClick={() => setShowFullImage(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {showFullImage && fileUrl && (
              <div
                className="chat-image-lightbox"
                onClick={() => setShowFullImage(false)}
              >
                <img src={fileUrl} alt={attachment.file_name} />
                <button className="chat-lightbox-close">✕</button>
              </div>
            )}
          </>
        ) : (
          <div className="chat-attachment-loading">Lädt Bild...</div>
        )}
      </div>
    );
  }

  // Video attachment
  if (category === 'video') {
    return (
      <div className="chat-attachment chat-attachment--video">
        {fileUrl ? (
          <video
            controls
            className="chat-attachment-preview"
            poster={thumbnailUrl || undefined}
          >
            <source src={fileUrl} type={attachment.file_type} />
            Dein Browser unterstützt keine Videos.
          </video>
        ) : (
          <div className="chat-attachment-loading">Lädt Video...</div>
        )}
      </div>
    );
  }

  // Audio attachment
  if (category === 'audio') {
    return (
      <div className="chat-attachment chat-attachment--audio">
        {fileUrl ? (
          <>
            <audio controls className="chat-attachment-audio">
              <source src={fileUrl} type={attachment.file_type} />
              Dein Browser unterstützt keine Audios.
            </audio>
            <span className="chat-attachment-name">🎵 {attachment.file_name}</span>
          </>
        ) : (
          <div className="chat-attachment-loading">Lädt Audio...</div>
        )}
      </div>
    );
  }

  // Generic file download
  return (
    <a
      href={fileUrl || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="chat-attachment chat-attachment--file"
      download={attachment.file_name}
      onClick={(e) => {
        if (!fileUrl) {
          e.preventDefault();
        }
      }}
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
};

export default ChatAttachment;
