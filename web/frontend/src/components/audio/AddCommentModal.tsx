// ============================================
// ADD COMMENT MODAL
// Create comment at current playback position
// ============================================

import { useState } from 'react';
import Button from '../ui/Button';

interface AddCommentModalProps {
  timestampMs: number;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export default function AddCommentModal({
  timestampMs,
  onSubmit,
  onCancel,
}: AddCommentModalProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setSubmitting(true);
    await onSubmit(content.trim());
    setSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
    // Escape to cancel
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content add-comment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Comment at {formatTimestamp(timestampMs)}</h2>
          <button className="modal-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <textarea
            className="comment-input"
            placeholder="Enter your comment... (Ctrl+Enter to submit)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
            autoFocus
            disabled={submitting}
          />

          <div className="modal-actions">
            <Button variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
            >
              {submitting ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </div>
      </div>
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
