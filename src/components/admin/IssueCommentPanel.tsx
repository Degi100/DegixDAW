// ============================================================================
// ISSUE COMMENT PANEL - Sidebar for viewing/adding comments
// ============================================================================

import { useState } from 'react';
import { useIssueComments, type IssueCommentWithUser } from '../../hooks/useIssueComments';
import { useAuth } from '../../hooks/useAuth';
import { formatRelativeTime } from '../../lib/services/issues';

interface IssueCommentPanelProps {
  issueId: string;
  issueTitle: string;
  onClose: () => void;
}

export default function IssueCommentPanel({
  issueId,
  issueTitle,
  onClose,
}: IssueCommentPanelProps) {
  const { user } = useAuth();
  const { comments, loading, addComment, removeComment } = useIssueComments(issueId);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    const result = await addComment({
      issue_id: issueId,
      comment: newComment.trim(),
      action_type: 'comment',
    });

    if (result.success) {
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Kommentar wirklich löschen?')) return;
    await removeComment(commentId);
  };

  const getActionIcon = (actionType: string | null) => {
    switch (actionType) {
      case 'status_change':
        return '🔄';
      case 'assignment':
        return '👤';
      case 'label_change':
        return '🏷️';
      default:
        return '💬';
    }
  };

  return (
    <div className="issue-comment-panel">
      {/* Header */}
      <div className="issue-comment-panel__header">
        <div className="issue-comment-panel__title">
          <h3>💬 Comments</h3>
          <p className="issue-comment-panel__subtitle">{issueTitle}</p>
        </div>
        <button onClick={onClose} className="issue-comment-panel__close">
          ✕
        </button>
      </div>

      {/* Comments List */}
      <div className="issue-comment-panel__body">
        {loading ? (
          <div className="issue-comment-panel__loading">
            <div className="spinner"></div>
            <p>Loading comments...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="issue-comment-panel__empty">
            <p>💭 Noch keine Kommentare</p>
            <small>Sei der Erste, der kommentiert!</small>
          </div>
        ) : (
          <div className="issue-comment-panel__comments">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isOwn={comment.user_id === user?.id}
                onDelete={handleDelete}
                getActionIcon={getActionIcon}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="issue-comment-panel__footer">
        <form onSubmit={handleSubmit} className="issue-comment-panel__form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Kommentar schreiben..."
            className="issue-comment-panel__textarea"
            rows={3}
            disabled={submitting}
          />
          <div className="issue-comment-panel__actions">
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="issue-comment-panel__submit"
            >
              {submitting ? '⏳ Wird gesendet...' : '📤 Senden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// COMMENT ITEM COMPONENT
// ============================================================================

interface CommentItemProps {
  comment: IssueCommentWithUser;
  isOwn: boolean;
  onDelete: (id: string) => void;
  getActionIcon: (actionType: string | null) => string;
}

function CommentItem({ comment, isOwn, onDelete, getActionIcon }: CommentItemProps) {
  const isAutoComment = comment.action_type && comment.action_type !== 'comment';

  return (
    <div className={`comment-item ${isOwn ? 'comment-item--own' : ''} ${isAutoComment ? 'comment-item--auto' : ''}`}>
      <div className="comment-item__header">
        <div className="comment-item__author">
          <span className="comment-item__icon">{getActionIcon(comment.action_type)}</span>
          <strong>{comment.user_username || comment.user_email?.split('@')[0] || 'Unknown'}</strong>
          {isAutoComment && (
            <span className="comment-item__auto-badge">Auto</span>
          )}
        </div>
        <div className="comment-item__meta">
          <span className="comment-item__time">
            {formatRelativeTime(comment.created_at)}
          </span>
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="comment-item__delete"
              title="Löschen"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className="comment-item__content">
        <p>{comment.comment}</p>

        {/* Metadata Display (for status/assignment changes) */}
        {comment.metadata && Object.keys(comment.metadata).length > 0 && (
          <div className="comment-item__metadata">
            {comment.metadata.old_status && comment.metadata.new_status && (
              <small>
                Status: <code>{comment.metadata.old_status}</code> → <code>{comment.metadata.new_status}</code>
              </small>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
