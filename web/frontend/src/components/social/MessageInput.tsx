import React, { useState, useRef, useEffect } from 'react';
import { useMessageAttachments } from '../../hooks/useMessageAttachments';

interface MessageInputProps {
  conversationId: string;
  onSend: (content: string, messageType: 'text' | 'image' | 'video' | 'voice' | 'file') => Promise<void>;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  onSend,
  onTyping,
  onStopTyping,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { uploadAndAttach, uploads } = useMessageAttachments();
  
  const uploading = uploads.some(u => u.status === 'uploading' || u.status === 'processing');
  const progress = uploads.length > 0 
    ? uploads.reduce((sum, u) => sum + u.progress, 0) / uploads.length 
    : 0;

  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '👏', '💯', '🙏', '😍', '🤔', '😎', '😢', '😮', '🙌'];

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Trigger typing indicator
    if (value.trim()) {
      onTyping();
      
      // Reset timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onStopTyping();
      }, 3000);
    } else {
      onStopTyping();
    }
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || isSending || uploading) return;

    setIsSending(true);
    onStopTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      // Send files first if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          // Create placeholder message ID (in real app, this comes from sending the message first)
          const messageId = crypto.randomUUID();
          await uploadAndAttach(file, messageId, conversationId);
        }
        setSelectedFiles([]);
        setMessage('');
      } else if (message.trim()) {
        // Send text message
        await onSend(message.trim(), 'text');
        setMessage('');
      }

      // Focus back to input
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="message-input-container">
      {/* File Preview */}
      {selectedFiles.length > 0 && (
        <div className="file-preview">
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-preview__item">
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="file-preview__image"
                />
              ) : (
                <div className="file-preview__icon">
                  {file.type.startsWith('video/') ? '🎥' : 
                   file.type.startsWith('audio/') ? '🎤' : '📎'}
                </div>
              )}
              <div className="file-preview__info">
                <span className="file-preview__name">{file.name}</span>
                <span className="file-preview__size">{formatFileSize(file.size)}</span>
              </div>
              <button
                className="file-preview__remove"
                onClick={() => handleRemoveFile(index)}
                aria-label="Datei entfernen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="upload-progress">
          <div className="upload-progress__bar">
            <div
              className="upload-progress__fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="upload-progress__text">{Math.round(progress)}%</span>
        </div>
      )}

      {/* Input Area */}
      <div className="message-input">
        {/* Emoji Button */}
        <button
          className="message-input__button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled || uploading}
          aria-label="Emoji auswählen"
        >
          😊
        </button>

        {/* File Attachment Button */}
        <button
          className="message-input__button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label="Datei anhängen"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Nachricht eingeben..."
          rows={1}
          disabled={disabled || isSending || uploading}
          className="message-input__textarea"
        />

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={(!message.trim() && selectedFiles.length === 0) || isSending || uploading || disabled}
          className="message-input__send"
          aria-label="Senden"
        >
          {uploading ? '⏳' : isSending ? '⏳' : '📤'}
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          <div className="emoji-picker__header">
            <span>Emoji auswählen</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="emoji-picker__close"
            >
              ✕
            </button>
          </div>
          <div className="emoji-picker__grid">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="emoji-picker__emoji"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
