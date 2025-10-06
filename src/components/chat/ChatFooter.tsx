/**
 * Props for the ChatFooter component
 */
interface ChatFooterProps {
  /** Callback function to view all chats */
  onViewAllChats: () => void;
}

/**
 * ChatFooter component provides a footer with navigation options
 *
 * Contains buttons and links for additional chat-related actions,
 * such as viewing all conversations in a dedicated page.
 *
 * @param props - Component props
 * @returns JSX.Element
 */
export function ChatFooter({ onViewAllChats }: ChatFooterProps) {
  return (
    <div className="chat-sidebar-footer">
      <button
        onClick={onViewAllChats}
        className="chat-view-all-btn"
      >
        Alle Chats anzeigen
      </button>
    </div>
  );
}