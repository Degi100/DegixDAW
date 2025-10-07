import { render, screen } from '@testing-library/react';
import ChatItem from './ChatItem';

describe('ChatItem', () => {
  it('renders name, last message and time', () => {
    render(<ChatItem id="1" name="Alice" lastMessage="Hello" timestamp="1min" unreadCount={2} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('1min')).toBeInTheDocument();
  });
});
