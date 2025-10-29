// ============================================
// CREATE VERSION MODAL
// Modal for creating a new project version
// ============================================

import { useState } from 'react';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (tag: string, changelog: string) => Promise<void>;
  creating?: boolean;
  nextVersionNumber: number;
}

export default function CreateVersionModal({
  isOpen,
  onClose,
  onCreate,
  creating = false,
  nextVersionNumber,
}: CreateVersionModalProps) {
  const [tag, setTag] = useState('');
  const [changelog, setChangelog] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate(tag, changelog);
    // Reset form
    setTag('');
    setChangelog('');
  };

  const handleClose = () => {
    if (!creating) {
      setTag('');
      setChangelog('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content version-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Version</h2>
          <button
            onClick={handleClose}
            className="modal-close"
            disabled={creating}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="version-preview">
            <div className="version-badge">
              v{nextVersionNumber}
              {tag && <span className="tag-preview">{tag}</span>}
            </div>
            <p className="version-hint">
              This will create a snapshot of your current project state
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="version-tag">
              Version Tag <span className="optional">(optional)</span>
            </label>
            <input
              id="version-tag"
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g., beta, rc1, final, milestone"
              maxLength={50}
              disabled={creating}
              className="form-input"
            />
            <small className="form-hint">
              Add a label to identify this version (e.g., "beta", "final")
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="version-changelog">
              Changelog <span className="optional">(optional)</span>
            </label>
            <textarea
              id="version-changelog"
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="What changed in this version?&#10;&#10;• Added reverb to vocals&#10;• Fixed timing on drums&#10;• Adjusted mix levels"
              rows={6}
              maxLength={500}
              disabled={creating}
              className="form-textarea"
            />
            <small className="form-hint">
              {changelog.length}/500 characters
            </small>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                <>📸 Create Version</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
