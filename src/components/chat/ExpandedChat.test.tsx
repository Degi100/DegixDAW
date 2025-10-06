import { render, screen, fireEvent } from '@testing-library/react';
import ExpandedChat from './ExpandedChat';

// Mock supabase to prevent import.meta usage in test environment and to provide messages
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'messages') {
        return {
          select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [
            {
              id: 'm1',
              conversation_id: 'c1',
              sender_id: 'u1',
              content: 'Loaded Hello',
              message_type: 'text',
              is_edited: false,
              edited_at: null,
              is_deleted: false,
              deleted_at: null,
              reply_to_id: null,
              created_at: '2025-10-05T10:00:00Z',
              updated_at: '2025-10-05T10:00:00Z',
              read_receipts: [],
            },
            {
              id: 'm2',
              conversation_id: 'c1',
              sender_id: 'u2',
              content: 'Loaded Hi',
              message_type: 'text',
              is_edited: false,
              edited_at: null,
              is_deleted: false,
              deleted_at: null,
              reply_to_id: null,
              created_at: '2025-10-05T10:01:00Z',
              updated_at: '2025-10-05T10:01:00Z',
              read_receipts: [],
            },
          ] }) }) }) }),
        };
      }
      return {
        select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ then: (cb: (res: { data: unknown[] }) => unknown) => Promise.resolve(cb({ data: [] })) }) }) }) }),
      };
    },
    channel: () => ({ on: () => ({ subscribe: jest.fn() }) }),
    removeChannel: jest.fn(),
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }
  }
}), { virtual: true });
import type { Message } from '../../hooks/useMessages';

describe('ExpandedChat', () => {
  const messages: Message[] = [
    {
      id: 'm1',
      conversation_id: 'c1',
      sender_id: 'u1',
      content: 'Hello',
  message_type: 'text',
      is_edited: false,
      edited_at: null,
      is_deleted: false,
      deleted_at: null,
      reply_to_id: null,
      created_at: '2025-10-05T10:00:00Z',
      updated_at: '2025-10-05T10:00:00Z',
      read_receipts: [],
    },
    {
      id: 'm2',
      conversation_id: 'c1',
      sender_id: 'u2',
      content: 'Hi',
  message_type: 'text',
      is_edited: false,
      edited_at: null,
      is_deleted: false,
      deleted_at: null,
      reply_to_id: null,
      created_at: '2025-10-05T10:01:00Z',
      updated_at: '2025-10-05T10:01:00Z',
      read_receipts: [],
    },
  ];

  it('renders messages and calls onSendQuickMessage', () => {
    const onSendQuickMessage = jest.fn();
    const onFileUpload = jest.fn();
    const onOpenChat = jest.fn();

    render(
      <ExpandedChat
        chatId="c1"
        messages={messages}
        currentUserId="u1"
        onSendQuickMessage={onSendQuickMessage}
        onFileUpload={onFileUpload}
        onOpenChat={onOpenChat}
        historyContainerRef={{ current: null }}
        historyEndRef={{ current: null }}
        showScrollButton={false}
        onScroll={() => {}}
        scrollToBottom={() => {}}
        showAttachMenu={false}
        isSendingMessage={false}
        messageText=""
        setMessageText={() => {}}
      />
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/nachricht/i);
    fireEvent.change(input, { target: { value: 'Quick reply' } });

    // send button is rendered as an icon button; select via class
    const sendButton = document.querySelector('.chat-quick-send') as HTMLButtonElement;
    expect(sendButton).toBeTruthy();
    fireEvent.click(sendButton!);

    expect(onSendQuickMessage).toHaveBeenCalled();
  });

  it('loads and renders messages via useConversationMessages hook', async () => {
    const onSendQuickMessage = jest.fn();
    const onFileUpload = jest.fn();
    const onOpenChat = jest.fn();
    const historyEndRef = { current: null };
    const historyContainerRef = { current: null };
    const onScroll = jest.fn();
    const scrollToBottom = jest.fn();

    render(
      <ExpandedChat
        chatId="c1"
        // no messages prop, so useConversationMessages loads them
        currentUserId="u1"
        onSendQuickMessage={onSendQuickMessage}
        onFileUpload={onFileUpload}
        onOpenChat={onOpenChat}
        historyContainerRef={historyContainerRef}
        historyEndRef={historyEndRef}
        showScrollButton={false}
        onScroll={onScroll}
        scrollToBottom={scrollToBottom}
        showAttachMenu={false}
        isSendingMessage={false}
        messageText=""
        setMessageText={() => {}}
      />
    );

    // Wait for messages to load and render
    expect(await screen.findByText('Loaded Hello')).toBeInTheDocument();
    expect(screen.getByText('Loaded Hi')).toBeInTheDocument();

    // Check that historyEndRef is set (div with ref)
    expect(historyEndRef.current).toBeTruthy();

    // Simulate scroll event
    const historyDiv = document.querySelector('.chat-history');
    if (historyDiv) {
      fireEvent.scroll(historyDiv);
      expect(onScroll).toHaveBeenCalled();
    }
  });
});
