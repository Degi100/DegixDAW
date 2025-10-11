/**
 * ExportModal Component
 *
 * Modal for exporting Analytics data
 * - Format selection (JSON/CSV)
 * - Preview of export contents
 * - Download trigger
 */

import { useState } from 'react';
import { exportAnalytics } from '../../../lib/services/analytics/exportService';
import type { ProjectMetrics, StorageStats, Milestone } from '../../../lib/services/analytics/types';
import './ExportModal.scss';

interface ExportModalProps {
  metrics: ProjectMetrics | null;
  storage: StorageStats | null;
  milestones: Milestone[];
  onClose: () => void;
}

export function ExportModal({ metrics, storage, milestones, onClose }: ExportModalProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      // Trigger export
      exportAnalytics(format, metrics, storage, milestones);

      // Success feedback
      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('[ExportModal] Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
      setExporting(false);
    }
  };

  const getFilename = () => {
    const date = new Date().toISOString().split('T')[0];
    return `degixdaw-analytics-${date}.${format}`;
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="export-modal__header">
          <h2>📤 Export Analytics</h2>
          <button className="export-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="export-modal__content">
          {/* Format Selection */}
          <div className="export-section">
            <label className="export-label">Export Format</label>
            <div className="export-format-options">
              <button
                className={`format-option ${format === 'json' ? 'active' : ''}`}
                onClick={() => setFormat('json')}
              >
                <span className="format-icon">📄</span>
                <div className="format-details">
                  <strong>JSON</strong>
                  <p>Structured data for APIs</p>
                </div>
              </button>
              <button
                className={`format-option ${format === 'csv' ? 'active' : ''}`}
                onClick={() => setFormat('csv')}
              >
                <span className="format-icon">📊</span>
                <div className="format-details">
                  <strong>CSV</strong>
                  <p>Excel/Google Sheets compatible</p>
                </div>
              </button>
            </div>
          </div>

          {/* Export Preview */}
          <div className="export-section">
            <label className="export-label">Export Contents</label>
            <div className="export-preview">
              <div className="export-item">
                <span className="export-item__icon">👥</span>
                <span className="export-item__label">User Metrics</span>
                <span className="export-item__value">
                  {metrics?.users.total || 0} users
                </span>
              </div>
              <div className="export-item">
                <span className="export-item__icon">💬</span>
                <span className="export-item__label">Message Stats</span>
                <span className="export-item__value">
                  {metrics?.messages.total || 0} messages
                </span>
              </div>
              <div className="export-item">
                <span className="export-item__icon">🐛</span>
                <span className="export-item__label">Issue Tracking</span>
                <span className="export-item__value">
                  {metrics?.issues.total || 0} issues
                </span>
              </div>
              <div className="export-item">
                <span className="export-item__icon">💾</span>
                <span className="export-item__label">Storage Breakdown</span>
                <span className="export-item__value">
                  {storage?.database.tables.length || 0} tables
                </span>
              </div>
              <div className="export-item">
                <span className="export-item__icon">🎯</span>
                <span className="export-item__label">Milestones</span>
                <span className="export-item__value">{milestones.length} events</span>
              </div>
            </div>
          </div>

          {/* Filename Preview */}
          <div className="export-section">
            <label className="export-label">Filename</label>
            <div className="export-filename">
              <code>{getFilename()}</code>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="export-error">
              <span className="export-error__icon">⚠️</span>
              <span className="export-error__message">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="export-modal__footer">
          <button className="btn btn--secondary" onClick={onClose} disabled={exporting}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            onClick={handleExport}
            disabled={exporting || !metrics || !storage}
          >
            {exporting ? (
              <>
                <span className="spinner-small"></span>
                Exporting...
              </>
            ) : (
              <>
                📥 Download {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
