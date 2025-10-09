// ============================================================================
// ISSUE MODAL - Enhanced with Labels, Assignment, PR URL
// ============================================================================

import { useState, useEffect } from 'react';
import type { IssueWithDetails, CreateIssueRequest, UpdateIssueRequest } from '../../lib/services/issues';
import { getCategories } from '../../lib/constants/categories';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateIssueRequest | UpdateIssueRequest) => Promise<void>;
  issue?: IssueWithDetails | null;
  mode: 'create' | 'edit';
  availableLabels?: string[];
}

const DEFAULT_LABELS = ['bug', 'feature', 'urgent', 'docs', 'enhancement', 'question'];

export default function IssueModalEnhanced({
  isOpen,
  onClose,
  onSubmit,
  issue,
  mode,
  availableLabels = DEFAULT_LABELS,
}: IssueModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: '',
    labels: [] as string[],
    pr_url: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories] = useState(getCategories());

  // Initialize form data
  useEffect(() => {
    if (issue && mode === 'edit') {
      setFormData({
        title: issue.title,
        description: issue.description || '',
        priority: issue.priority,
        category: issue.category || '',
        labels: issue.labels || [],
        pr_url: (issue.metadata?.pr_url as string) || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        labels: [],
        pr_url: '',
      });
    }
    setErrors({});
  }, [issue, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Titel muss mindestens 3 Zeichen lang sein';
    }

    if (formData.pr_url && !isValidUrl(formData.pr_url)) {
      newErrors.pr_url = 'Ungültige URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData: any = {
        title: formData.title.trim(),
        ...(formData.description.trim() && { description: formData.description.trim() }),
        priority: formData.priority,
        ...(formData.category && { category: formData.category }),
        ...(formData.labels.length > 0 && { labels: formData.labels }),
        ...(formData.pr_url && { metadata: { pr_url: formData.pr_url } }),
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Error submitting issue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabelToggle = (label: string) => {
    setFormData((prev) => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter((l) => l !== label)
        : [...prev.labels, label],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{mode === 'create' ? '➕ Neues Issue' : '✏️ Issue bearbeiten'}</h2>
          <button onClick={onClose} className="modal-close">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">
              Titel <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`form-input ${errors.title ? 'form-input--error' : ''}`}
              placeholder="Issue-Titel eingeben..."
              disabled={loading}
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
              placeholder="Detaillierte Beschreibung..."
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Priority & Category */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Priorität</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="form-select"
                disabled={loading}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
                <option value="critical">🚨 Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Kategorie</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
                disabled={loading}
              >
                <option value="">Keine Kategorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div className="form-group">
            <label className="form-label">Labels</label>
            <div className="label-selector">
              {availableLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => handleLabelToggle(label)}
                  className={`label-badge ${formData.labels.includes(label) ? 'label-badge--active' : ''}`}
                  disabled={loading}
                >
                  🏷️ {label}
                </button>
              ))}
            </div>
          </div>

          {/* PR URL (Only in Edit Mode + Done Status) */}
          {mode === 'edit' && issue?.status === 'done' && (
            <div className="form-group">
              <label className="form-label">Pull Request URL</label>
              <input
                type="url"
                value={formData.pr_url}
                onChange={(e) => setFormData({ ...formData, pr_url: e.target.value })}
                className={`form-input ${errors.pr_url ? 'form-input--error' : ''}`}
                placeholder="https://github.com/user/repo/pull/123"
                disabled={loading}
              />
              {errors.pr_url && <span className="form-error">{errors.pr_url}</span>}
            </div>
          )}

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn--secondary" disabled={loading}>
              Abbrechen
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? '⏳ Speichern...' : mode === 'create' ? '➕ Erstellen' : '💾 Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
