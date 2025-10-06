import React from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface SidebarHeaderProps {
  isGradientEnabled: boolean;
  isPinned: boolean;
  isMobile: boolean;
  onToggleGradient: () => void;
  onTogglePin: () => void;
  onResetPosition: () => void;
  onClose: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

export default function SidebarHeader({
  isGradientEnabled,
  isPinned,
  isMobile,
  onToggleGradient,
  onTogglePin,
  onResetPosition,
  onClose,
  onDragStart,
}: SidebarHeaderProps) {
  const { isAdmin } = useAdmin();
  const { success, error } = useToast();

  const handleDeleteAllMessages = async () => {
    if (!window.confirm('⚠️ ACHTUNG: Alle Nachrichten werden PERMANENT gelöscht! Fortfahren?')) {
      return;
    }

    try {
      console.log('🗑️ Admin: Deleting all messages...');
      
      // Delete all attachments first
      const { error: attachError } = await supabase
        .from('message_attachments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (attachError) throw attachError;

      // Delete all messages
      const { error: msgError } = await supabase
        .from('messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (msgError) throw msgError;

      // Reset last_read_at
      const { error: resetError } = await supabase
        .from('conversation_members')
        .update({ last_read_at: null })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (resetError) throw resetError;

      success('✅ Alle Nachrichten gelöscht! Seite neu laden.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error('❌ Error deleting messages:', err);
      error('Fehler beim Löschen der Nachrichten');
    }
  };

  return (
    <div className="chat-sidebar-header">
      {/* Dedicated drag handle area - only visible when pinned */}
      {!isMobile && isPinned && (
        <div 
          className="chat-sidebar-drag-handle"
          onMouseDown={onDragStart}
          title="Sidebar verschieben"
        >
          <div className="chat-sidebar-drag-indicator">⋮⋮</div>
        </div>
      )}
      
      <div className="chat-sidebar-title">
        <span className="chat-icon">💬</span>
        <h3>Chats</h3>
      </div>
      <div className="chat-sidebar-actions">
        {isAdmin && (
          <button 
            onClick={handleDeleteAllMessages} 
            className="chat-admin-delete-btn" 
            title="🔴 ADMIN: Alle Nachrichten löschen"
            style={{ 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              marginRight: '8px'
            }}
          >
            🗑️
          </button>
        )}
        <button onClick={onToggleGradient} className={`chat-gradient-btn ${isGradientEnabled ? 'active' : ''}`} title={isGradientEnabled ? 'Gradient deaktivieren' : 'Gradient aktivieren'}>
          {isGradientEnabled ? '✨' : '⭐'}
        </button>
        <button onClick={onTogglePin} className={`chat-pin-btn ${isPinned ? 'pinned' : ''}`} title={isPinned ? 'Sidebar lösen' : 'Sidebar fixieren'}>
          {isPinned ? '📌' : '📍'}
        </button>
        <button onClick={onResetPosition} className="chat-reset-btn" title="Zurück zum Ursprung">🔄</button>
        <button onClick={onClose} className="chat-close-btn" title="Chat schließen">✕</button>
      </div>
    </div>
  );
}