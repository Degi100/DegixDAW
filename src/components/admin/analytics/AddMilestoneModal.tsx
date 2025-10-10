/**
 * AddMilestoneModal Component
 *
 * Modal for creating custom milestones
 */

import { useState } from 'react';
import { createMilestone, type CreateMilestoneInput } from '../../../lib/services/analytics/milestonesService';
import type { MilestoneCategory } from '../../../lib/services/analytics/types';
import './AddMilestoneModal.scss';

interface AddMilestoneModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const EMOJI_PRESETS = ['🎯', '🚀', '🎤', '🎨', '💬', '🐛', '🔐', '🧪', '👑', '🔖', '🎉', '💡', '🔧', '📱', '🌐', '📊'];
const CATEGORIES: Array<{ value: MilestoneCategory; label: string }> = [
  { value: 'feature', label: 'Feature' },
  { value: 'release', label: 'Release' },
  { value: 'code', label: 'Code' },
  { value: 'users', label: 'Users' },
  { value: 'milestone', label: 'Milestone' }
];

export function AddMilestoneModal({ onClose, onSuccess }: AddMilestoneModalProps) {
  const [formData, setFormData] = useState<CreateMilestoneInput>({
    title: '',
    description: '',
    icon: '🎯',
    category: 'feature',
    milestone_date: new Date().toISOString().split('T')[0], // Today
    commit_hash: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const input: CreateMilestoneInput = {
        title: formData.title,
        icon: formData.icon,
        category: formData.category,
        milestone_date: formData.milestone_date
      };

      if (formData.description?.trim()) {
        input.description = formData.description.trim();
      }
      if (formData.commit_hash?.trim()) {
        input.commit_hash = formData.commit_hash.trim();
      }

      await createMilestone(input);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('[AddMilestoneModal] Failed to create milestone:', err);
      setError(err instanceof Error ? err.message : 'Failed to create milestone');
      setSaving(false);
    }
  };

  return (
    <div className="add-milestone-modal-overlay" onClick={onClose}>
      <div className="add-milestone-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-milestone-modal__header">
          <h2>➕ Add Milestone</h2>
          <button className="add-milestone-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Form */}
        <form className="add-milestone-modal__form" onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Speech-to-Text System"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Admin Issues können via Spracheingabe erstellt werden"
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Icon + Category Row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Icon *</label>
              <div className="icon-selector">
                <input
                  type="text"
                  className="form-input form-input--icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  maxLength={2}
                  required
                />
                <div className="icon-presets">
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`icon-preset ${formData.icon === emoji ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, icon: emoji })}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as MilestoneCategory })
                }
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date + Commit Hash Row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.milestone_date}
                onChange={(e) => setFormData({ ...formData, milestone_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Commit Hash (optional)</label>
              <input
                type="text"
                className="form-input"
                value={formData.commit_hash}
                onChange={(e) => setFormData({ ...formData, commit_hash: e.target.value })}
                placeholder="d1c3bc9"
                maxLength={40}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="form-error">
              <span className="form-error__icon">⚠️</span>
              <span className="form-error__message">{error}</span>
            </div>
          )}

          {/* Footer */}
          <div className="add-milestone-modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-small"></span>
                  Creating...
                </>
              ) : (
                '✅ Create Milestone'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
