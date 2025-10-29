import React, { useState } from 'react';
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
  const [showMenu, setShowMenu] = useState(false);

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
      {/* Dedicated drag handle area - only visible when NOT pinned (floating mode) */}
      {!isMobile && !isPinned && (
        <div
          className="chat-sidebar-drag-handle"
          onMouseDown={onDragStart}
          title="Sidebar verschieben"
          aria-label="Sidebar verschieben"
          role="button"
          tabIndex={0}
        >
          <div className="chat-sidebar-drag-indicator">⋮⋮</div>
        </div>
      )}
      
      <div className="chat-sidebar-title">
        <span className="chat-icon" role="img" aria-label="Chat Icon">💬</span>
        <h3>Chats</h3>
        {/* Badge entfernt - wird jetzt nur noch im globalen Header + per-ChatItem angezeigt */}
      </div>
      
      <div className="chat-sidebar-actions">
        {/* Close Button - Always visible, always works */}
        <button
          onClick={onClose}
          className="chat-close-btn"
          title="Chat schließen"
          aria-label="Chat schließen"
        >
          ✕
        </button>

        {/* Secondary Actions - Desktop only or in menu */}
        {!isMobile ? (
          <>
            {isAdmin && (
              <button 
                onClick={handleDeleteAllMessages} 
                className="chat-admin-delete-btn" 
                title="🔴 ADMIN: Alle Nachrichten löschen"
                aria-label="Admin: Alle Nachrichten löschen"
              >
                🗑️
              </button>
            )}
            <button 
              onClick={onToggleGradient} 
              className={`chat-gradient-btn ${isGradientEnabled ? 'active' : ''}`} 
              title={isGradientEnabled ? 'Gradient deaktivieren' : 'Gradient aktivieren'}
              aria-label={isGradientEnabled ? 'Gradient deaktivieren' : 'Gradient aktivieren'}
              aria-pressed={isGradientEnabled}
            >
              {isGradientEnabled ? '✨' : '⭐'}
            </button>
            <button 
              onClick={onTogglePin} 
              className={`chat-pin-btn ${isPinned ? 'pinned' : ''}`} 
              title={isPinned ? 'Sidebar lösen' : 'Sidebar fixieren'}
              aria-label={isPinned ? 'Sidebar lösen' : 'Sidebar fixieren'}
              aria-pressed={isPinned}
            >
              {isPinned ? '📌' : '📍'}
            </button>
            <button 
              onClick={onResetPosition} 
              className="chat-reset-btn" 
              title="Position zurücksetzen"
              aria-label="Position zurücksetzen"
            >
              🔄
            </button>
          </>
        ) : (
          /* Mobile: Overflow Menu */
          <div className="chat-sidebar-menu">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="chat-menu-btn"
              title="Mehr Optionen"
              aria-label="Mehr Optionen"
              aria-expanded={showMenu}
              aria-haspopup="true"
            >
              ⋯
            </button>
            {showMenu && (
              <div className="chat-sidebar-menu__dropdown" role="menu">
                {isAdmin && (
                  <button 
                    onClick={() => { handleDeleteAllMessages(); setShowMenu(false); }} 
                    className="chat-menu-item chat-menu-item--danger"
                    role="menuitem"
                  >
                    �️ Alle löschen
                  </button>
                )}
                <button 
                  onClick={() => { onToggleGradient(); setShowMenu(false); }}
                  className="chat-menu-item"
                  role="menuitem"
                >
                  {isGradientEnabled ? '✨ Gradient aus' : '⭐ Gradient an'}
                </button>
                <button 
                  onClick={() => { onTogglePin(); setShowMenu(false); }}
                  className="chat-menu-item"
                  role="menuitem"
                >
                  {isPinned ? '📍 Lösen' : '📌 Fixieren'}
                </button>
                <button 
                  onClick={() => { onResetPosition(); setShowMenu(false); }}
                  className="chat-menu-item"
                  role="menuitem"
                >
                  🔄 Zurücksetzen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}