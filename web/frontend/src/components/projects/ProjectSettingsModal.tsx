// ============================================
// PROJECT SETTINGS MODAL
// Edit project metadata (Key, BPM, Time Signature, etc.)
// ============================================

import { useState } from 'react';
import type { Project } from '../../types/projects';
import Button from '../ui/Button';

interface ProjectSettingsModalProps {
  project: Project;
  onClose: () => void;
  onSave: (updates: Partial<Project>) => Promise<void>;
}

const KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '5/4', '7/8', '2/4'];

export default function ProjectSettingsModal({
  project,
  onClose,
  onSave,
}: ProjectSettingsModalProps) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [key, setKey] = useState(project.key || 'C');
  const [bpm, setBpm] = useState(project.bpm);
  const [timeSignature, setTimeSignature] = useState(project.time_signature);
  const [isPublic, setIsPublic] = useState(project.is_public);
  const [status, setStatus] = useState(project.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        title,
        description,
        key,
        bpm,
        time_signature: timeSignature,
        is_public: isPublic,
        status,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save project settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content project-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Project Settings</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-form">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="project-title">Title</label>
              <input
                id="project-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="project-description">Description</label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            {/* Musical Settings */}
            <div className="form-row">
              {/* Key */}
              <div className="form-group">
                <label htmlFor="project-key">🎹 Key</label>
                <select
                  id="project-key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                >
                  {KEYS.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              {/* BPM */}
              <div className="form-group">
                <label htmlFor="project-bpm">⏱️ BPM</label>
                <input
                  id="project-bpm"
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  min={40}
                  max={300}
                  step={1}
                />
              </div>

              {/* Time Signature */}
              <div className="form-group">
                <label htmlFor="project-time-sig">🎼 Time Signature</label>
                <select
                  id="project-time-sig"
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                >
                  {TIME_SIGNATURES.map(ts => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project Settings */}
            <div className="form-row">
              {/* Status */}
              <div className="form-group">
                <label htmlFor="project-status">Status</label>
                <select
                  id="project-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'archived')}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Visibility */}
              <div className="form-group">
                <label htmlFor="project-visibility">Visibility</label>
                <select
                  id="project-visibility"
                  value={isPublic ? 'public' : 'private'}
                  onChange={(e) => setIsPublic(e.target.value === 'public')}
                >
                  <option value="private">🔒 Private</option>
                  <option value="public">🌍 Public</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
