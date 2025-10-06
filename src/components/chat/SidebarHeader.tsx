import React from 'react';

interface SidebarHeaderProps {
  totalUnreadCount: number;
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
  totalUnreadCount,
  isGradientEnabled,
  isPinned,
  isMobile,
  onToggleGradient,
  onTogglePin,
  onResetPosition,
  onClose,
  onDragStart,
}: SidebarHeaderProps) {
  return (
    <div
      className="chat-sidebar-header"
      onMouseDown={onDragStart}
      style={{ cursor: (isMobile || !isPinned) ? 'default' : 'move' }}
    >
      <div className="chat-sidebar-title">
        <span className="chat-icon">💬</span>
        <h3>Chats</h3>
        {totalUnreadCount > 0 && (
          <span className="chat-badge">{totalUnreadCount}</span>
        )}
      </div>
      <div className="chat-sidebar-actions">
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