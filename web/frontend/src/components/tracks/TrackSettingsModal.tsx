// ============================================
// TRACK SETTINGS MODAL
// Edit track metadata, audio properties, and display info
// ============================================

import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import type { Track, UpdateTrackRequest } from '../../types/tracks';

interface TrackSettingsModalProps {
  track: Track;
  onClose: () => void;
  onSave: (updates: UpdateTrackRequest) => Promise<void>;
}

export default function TrackSettingsModal({
  track,
  onClose,
  onSave,
}: TrackSettingsModalProps) {
  const [name, setName] = useState(track.name);
  const [color, setColor] = useState(track.color || '#4a90e2');
  const [trackNumber, setTrackNumber] = useState(track.track_number);
  const [saving, setSaving] = useState(false);

  // Detect if any changes were made
  const hasChanges =
    name !== track.name ||
    color !== (track.color || '#4a90e2') ||
    trackNumber !== track.track_number;

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const updates: UpdateTrackRequest = {};

      if (name !== track.name) updates.name = name;
      if (color !== track.color) updates.color = color;
      if (trackNumber !== track.track_number) updates.track_number = trackNumber;

      await onSave(updates);
      onClose();
    } catch (error) {
      console.error('Failed to save track settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content track-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>⚙️ Track Settings</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Track Name */}
          <div className="form-group">
            <label htmlFor="track-name">Track Name</label>
            <input
              id="track-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Kick Drum, Bass Line"
              autoFocus
            />
          </div>

          {/* Track Color */}
          <div className="form-group">
            <label htmlFor="track-color">Track Color</label>
            <div className="color-picker-group">
              <input
                id="track-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#4a90e2"
                className="color-hex-input"
              />
              <div
                className="color-preview"
                style={{ backgroundColor: color }}
                title={`Preview: ${color}`}
              />
            </div>
          </div>

          {/* Track Number */}
          <div className="form-group">
            <label htmlFor="track-number">Track Number</label>
            <input
              id="track-number"
              type="number"
              min="1"
              value={trackNumber}
              onChange={(e) => setTrackNumber(parseInt(e.target.value) || 1)}
              placeholder="1"
            />
          </div>

          {/* Track Info (Read-only) */}
          <div className="track-info-section">
            <h3>Track Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Type:</span>
                <span className="info-value">{track.track_type.toUpperCase()}</span>
              </div>
              {track.duration_ms && (
                <div className="info-item">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{formatDuration(track.duration_ms)}</span>
                </div>
              )}
              {track.sample_rate && (
                <div className="info-item">
                  <span className="info-label">Sample Rate:</span>
                  <span className="info-value">{(track.sample_rate / 1000).toFixed(1)} kHz</span>
                </div>
              )}
              {track.bit_depth && (
                <div className="info-item">
                  <span className="info-label">Bit Depth:</span>
                  <span className="info-value">{track.bit_depth} bit</span>
                </div>
              )}
              {track.channels && (
                <div className="info-item">
                  <span className="info-label">Channels:</span>
                  <span className="info-value">{track.channels === 1 ? 'Mono' : track.channels === 2 ? 'Stereo' : `${track.channels} channels`}</span>
                </div>
              )}
              {track.file_size && (
                <div className="info-item">
                  <span className="info-label">File Size:</span>
                  <span className="info-value">{formatFileSize(track.file_size)}</span>
                </div>
              )}
              {track.bpm && (
                <div className="info-item">
                  <span className="info-label">BPM:</span>
                  <span className="info-value">{track.bpm}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
