// src/pages/admin/components/versions/VersionFormModal.tsx
// Version Form Modal - Clean Form for Adding/Editing Versions

import { useState, useEffect } from 'react';
import type { VersionInfo } from '../../../../lib/version';

interface VersionFormModalProps {
  version: VersionInfo | null;
  isEditing: boolean;
  onSave: (versionData: Omit<VersionInfo, 'version'> & { version?: string }) => void;
  onClose: () => void;
}

export default function VersionFormModal({ version, isEditing, onSave, onClose }: VersionFormModalProps) {
  const [formData, setFormData] = useState({
    version: version?.version || '',
    type: version?.type || 'patch',
    added: version?.changes?.added?.join('\n') || '',
    fixed: version?.changes?.fixed?.join('\n') || '',
    changed: version?.changes?.changed?.join('\n') || ''
  });

  useEffect(() => {
    if (version) {
      setFormData({
        version: version.version,
        type: version.type,
        added: version.changes?.added?.join('\n') || '',
        fixed: version.changes?.fixed?.join('\n') || '',
        changed: version.changes?.changed?.join('\n') || ''
      });
    }
  }, [version]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const changes = {
      ...(formData.added.trim() && {
        added: formData.added.split('\n').filter(item => item.trim())
      }),
      ...(formData.fixed.trim() && {
        fixed: formData.fixed.split('\n').filter(item => item.trim())
      }),
      ...(formData.changed.trim() && {
        changed: formData.changed.split('\n').filter(item => item.trim())
      })
    };

    // Validierung
    if (!formData.version.trim()) {
      alert('Bitte geben Sie eine Versionsnummer ein.');
      return;
    }

    if (Object.keys(changes).length === 0) {
      alert('Bitte geben Sie mindestens eine Änderung ein.');
      return;
    }

    onSave({
      version: formData.version.trim(),
      type: formData.type as 'major' | 'minor' | 'patch',
      date: new Date().toISOString().split('T')[0],
      changes
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? '✏️ Version bearbeiten' : '➕ Version hinzufügen'}
          </h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="version">Versionsnummer *</label>
                <input
                  id="version"
                  type="text"
                  value={formData.version}
                  onChange={(e) => handleChange('version', e.target.value)}
                  placeholder="z.B. 1.2.3"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Typ *</label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  required
                >
                  <option value="patch">🔧 Patch</option>
                  <option value="minor">✨ Minor</option>
                  <option value="major">🏗️ Major</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="added">✨ Hinzugefügt</label>
              <textarea
                id="added"
                value={formData.added}
                onChange={(e) => handleChange('added', e.target.value)}
                placeholder="Eine Änderung pro Zeile..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fixed">🔧 Behoben</label>
              <textarea
                id="fixed"
                value={formData.fixed}
                onChange={(e) => handleChange('fixed', e.target.value)}
                placeholder="Eine Änderung pro Zeile..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="changed">📝 Geändert</label>
              <textarea
                id="changed"
                value={formData.changed}
                onChange={(e) => handleChange('changed', e.target.value)}
                placeholder="Eine Änderung pro Zeile..."
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Aktualisieren' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
