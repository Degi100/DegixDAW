// ============================================
// COMMENTS LIST COMPONENT
// List of track comments with actions
// ============================================

import { useState } from 'react';
import Button from '../ui/Button';
import type { TrackComment } from '../../types/tracks';

interface CommentsListProps {
  comments: TrackComment[];
  onCommentClick: (comment: TrackComment) => void;
  onToggleResolved: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  currentUserId?: string | undefined;
}

export default function CommentsList({
  comments,
  onCommentClick,
  onToggleResolved,
  onDelete,
  onEdit,
  currentUserId,
}: CommentsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleStartEdit = (comment: TrackComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (commentId: string) => {
    onEdit(commentId, editContent);
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  if (comments.length === 0) {
    return (
      <div className="comments-list empty">
        <p>No comments yet. Add one at a specific timestamp!</p>
      </div>
    );
  }

  return (
    <div className="comments-list">
      {comments.map((comment) => {
        const isOwner = currentUserId === comment.author_id;
        const isEditing = editingId === comment.id;

        return (
          <div
            key={comment.id}
            className={`comment-item ${comment.is_resolved ? 'resolved' : ''}`}
          >
            {/* Header */}
            <div className="comment-header">
              <button
                className="comment-timestamp"
                onClick={() => onCommentClick(comment)}
                title="Jump to timestamp"
              >
                🕐 {formatTimestamp(comment.timestamp_ms)}
              </button>

              <div className="comment-meta">
                <span className="comment-author">
                  {comment.username || 'Unknown'}
                </span>
                <span className="comment-date">
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="comment-content">
              {isEditing ? (
                <div className="comment-edit">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="comment-edit-input"
                    rows={3}
                    autoFocus
                  />
                  <div className="comment-edit-actions">
                    <Button variant="secondary" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={() => handleSaveEdit(comment.id)}>
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="comment-text">{comment.content}</p>
              )}
            </div>

            {/* Actions */}
            <div className="comment-actions">
              <button
                className="comment-action-btn"
                onClick={() => onToggleResolved(comment.id)}
                title={comment.is_resolved ? 'Mark as unresolved' : 'Mark as resolved'}
              >
                {comment.is_resolved ? '↩️ Reopen' : '✅ Resolve'}
              </button>

              {isOwner && !isEditing && (
                <>
                  <button
                    className="comment-action-btn"
                    onClick={() => handleStartEdit(comment)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="comment-action-btn delete"
                    onClick={() => {
                      if (confirm('Delete this comment?')) {
                        onDelete(comment.id);
                      }
                    }}
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
