// ============================================
// SEND FILE MODAL V2
// Uploads files as chat messages
// Supports: With recipient OR self-conversation
// ============================================

import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { useMessageAttachments } from '../../hooks/useMessageAttachments';
import { MAX_FILE_SIZE, MAX_FILE_SIZE_MB } from '../../lib/constants/storage';
import './SendFileModal.scss';

interface SendFileModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface UserSearchResult {
  id: string;
  username: string;
}

export default function SendFileModal({ userId, onClose, onSuccess }: SendFileModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<UserSearchResult | null>(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { error: showError, success: showSuccess } = useToast();
  const { uploadAndAttach } = useMessageAttachments();

  // ============================================
  // FILE SELECTION
  // ============================================
  const handleFileSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      showError(`Datei zu groß! Max ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ============================================
  // USER SEARCH
  // ============================================
  const searchUsers = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .neq('id', userId) // Exclude self
          .ilike('username', `%${query}%`)
          .limit(10);

        if (error) throw error;

        setSearchResults(data || []);
      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setSearching(false);
      }
    },
    [userId]
  );

  const handleRecipientInputChange = (value: string) => {
    setRecipientQuery(value);
    searchUsers(value);
  };

  const handleSelectRecipient = (user: UserSearchResult) => {
    setSelectedRecipient(user);
    setRecipientQuery(user.username);
    setSearchResults([]);
  };

  const handleClearRecipient = () => {
    setSelectedRecipient(null);
    setRecipientQuery('');
    setSearchResults([]);
  };

  // ============================================
  // GET OR CREATE CONVERSATION
  // Uses conversation_members table (not user1_id/user2_id)
  // ============================================
  const getOrCreateConversation = async (otherUserId: string): Promise<string | null> => {
    try {
      const isSelfConversation = otherUserId === userId;

      // 1. Get all my conversations
      const { data: myConvs } = await supabase
        .from('conversation_members')
        .select('conversation_id, conversations!inner(type)')
        .eq('user_id', userId);

      if (myConvs) {
        const directConvIds = myConvs
          .filter((m: any) => m.conversations.type === 'direct')
          .map((m: any) => m.conversation_id);

        // 2. For each direct conversation, check if it has EXACTLY the right members
        for (const convId of directConvIds) {
          // Get ALL members of this conversation
          const { data: allMembers } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', convId);

          if (!allMembers) continue;

          const memberIds = allMembers.map(m => m.user_id).sort();

          if (isSelfConversation) {
            // Self-conversation: EXACTLY 1 member (only userId)
            if (memberIds.length === 1 && memberIds[0] === userId) {
              return convId;
            }
          } else {
            // Normal conversation: EXACTLY 2 members (userId + otherUserId)
            const expectedIds = [userId, otherUserId].sort();
            if (
              memberIds.length === 2 &&
              memberIds[0] === expectedIds[0] &&
              memberIds[1] === expectedIds[1]
            ) {
              return convId;
            }
          }
        }
      }

      // 3. No existing conversation found, create new one
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          created_by: userId,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // 4. Add member(s) to conversation
      if (isSelfConversation) {
        // Self-conversation: only add current user
        await supabase
          .from('conversation_members')
          .insert({
            conversation_id: newConv.id,
            user_id: userId,
            role: 'admin',
          });
      } else {
        // Normal conversation: add both users
        await supabase
          .from('conversation_members')
          .insert([
            {
              conversation_id: newConv.id,
              user_id: userId,
              role: 'admin',
            },
            {
              conversation_id: newConv.id,
              user_id: otherUserId,
              role: 'member',
            },
          ]);
      }

      return newConv.id;
    } catch (err) {
      console.error('Error getting/creating conversation:', err);
      showError('Fehler beim Erstellen der Konversation');
      return null;
    }
  };

  // ============================================
  // SEND FILE
  // ============================================
  const handleSend = async () => {
    if (!selectedFile) {
      showError('Bitte wähle eine Datei aus');
      return;
    }

    setUploading(true);

    try {
      // 1. Determine recipient (self if none selected)
      const recipientId = selectedRecipient?.id || userId;

      // 2. Get or create conversation
      const conversationId = await getOrCreateConversation(recipientId);
      if (!conversationId) {
        throw new Error('Konversation konnte nicht erstellt werden');
      }

      // 3. Create message entry
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: message || null,
          message_type: 'file',
        })
        .select('id')
        .single();

      if (messageError) throw messageError;

      // 4. Upload file attachment using existing hook
      const result = await uploadAndAttach(selectedFile, messageData.id, conversationId);

      if (!result) {
        throw new Error('Datei-Upload fehlgeschlagen');
      }

      // 5. Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Success!
      if (selectedRecipient) {
        showSuccess(`Datei an ${selectedRecipient.username} gesendet!`);
      } else {
        showSuccess('Datei hochgeladen!');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error sending file:', err);
      showError('Fehler beim Senden der Datei');
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // FILE INFO
  // ============================================
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📕';
    return '📁';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal send-file-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Datei hochladen / senden</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Step 1: File Selection */}
          <div className="send-file-step">
            <label className="send-file-label">
              1. Datei auswählen <span className="required">*</span>
            </label>

            {!selectedFile ? (
              <div
                className={`file-drop-zone ${dragActive ? 'drag-active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="file-drop-icon">📁</div>
                <div className="file-drop-text">
                  <strong>Datei hier ablegen</strong>
                  <span>oder klicken zum Auswählen</span>
                </div>
                <div className="file-drop-limit">Max {MAX_FILE_SIZE_MB}MB</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="file-selected">
                <div className="file-selected-icon">{getFileIcon(selectedFile.type)}</div>
                <div className="file-selected-info">
                  <div className="file-selected-name">{selectedFile.name}</div>
                  <div className="file-selected-size">{formatFileSize(selectedFile.size)}</div>
                </div>
                <button className="file-selected-remove" onClick={() => setSelectedFile(null)}>
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Recipient Selection */}
          <div className="send-file-step">
            <label className="send-file-label" htmlFor="recipient-search">
              2. Empfänger auswählen <span className="optional">(optional)</span>
            </label>

            <div className="recipient-search">
              <input
                id="recipient-search"
                type="text"
                className="recipient-search-input"
                placeholder="Username suchen..."
                value={recipientQuery}
                onChange={(e) => handleRecipientInputChange(e.target.value)}
                disabled={!!selectedRecipient}
              />

              {selectedRecipient && (
                <button className="recipient-clear" onClick={handleClearRecipient}>
                  ✕
                </button>
              )}

              {searching && <div className="recipient-search-loading">🔍</div>}

              {searchResults.length > 0 && (
                <div className="recipient-search-results">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      className="recipient-search-result"
                      onClick={() => handleSelectRecipient(user)}
                    >
                      <div className="recipient-avatar">
                        <div className="recipient-avatar-placeholder">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="recipient-username">{user.username}</div>
                    </button>
                  ))}
                </div>
              )}

              {!selectedRecipient && (
                <small className="recipient-hint">
                  💡 Kein Empfänger = Datei landet in "Meine Dateien"
                </small>
              )}
            </div>
          </div>

          {/* Step 3: Message (optional) */}
          <div className="send-file-step">
            <label className="send-file-label" htmlFor="file-message">
              3. Nachricht <span className="optional">(optional)</span>
            </label>
            <textarea
              id="file-message"
              className="file-message-input"
              placeholder="z.B. 'Hier ist der Track!'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <small className="char-count">{message.length}/500</small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={uploading}>
            Abbrechen
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <span className="spinner-small"></span> {selectedRecipient ? 'Sende...' : 'Lade hoch...'}
              </>
            ) : (
              <>
                {selectedRecipient ? '📤 Senden' : '📤 Hochladen'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
