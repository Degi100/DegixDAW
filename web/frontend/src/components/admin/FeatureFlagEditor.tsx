// ============================================
// FEATURE FLAG EDITOR - SINGLE FEATURE
// Inline-Editor mit Pending Changes
// ============================================

import { useState, useEffect } from 'react';
import { updateAllowedRolesAsync, type UserRole, type FeatureFlag } from '../../lib/constants/featureFlags';
import { useToast } from '../../hooks/useToast';

interface FeatureFlagEditorProps {
  feature: FeatureFlag;
}

export default function FeatureFlagEditor({ feature }: FeatureFlagEditorProps) {
  const { success, error: showError } = useToast();
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(feature.allowedRoles);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when feature changes (from Realtime)
  useEffect(() => {
    setSelectedRoles(feature.allowedRoles);
  }, [feature.allowedRoles]);

  const hasChanges = JSON.stringify(selectedRoles.sort()) !== JSON.stringify(feature.allowedRoles.sort());

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRoles(prev => {
      // If role is selected, remove it (but ensure at least one remains)
      if (prev.includes(role)) {
        const newRoles = prev.filter(r => r !== role);
        // Prevent removing all roles
        if (newRoles.length === 0) {
          showError('Mindestens eine Rolle muss ausgewählt sein!');
          return prev;
        }
        return newRoles;
      }
      // Add role
      return [...prev, role];
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data, error } = await updateAllowedRolesAsync(feature.id, selectedRoles);

      if (error) {
        console.error('Error saving roles:', error);
        showError(`Fehler beim Speichern: ${error.message}`);
        // Rollback to original
        setSelectedRoles(feature.allowedRoles);
      } else if (data) {
        console.log('Roles saved successfully:', data.allowedRoles);
        success('Zugriffsrollen gespeichert!');
      }
    } catch (err) {
      console.error('Unexpected error saving roles:', err);
      showError('Unerwarteter Fehler beim Speichern');
      // Rollback to original
      setSelectedRoles(feature.allowedRoles);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedRoles(feature.allowedRoles);
  };

  const allRoles: UserRole[] = ['public', 'user', 'moderator', 'admin'];

  return (
    <div className="feature-flag-editor">
      <div className="role-checkboxes-grid">
        {allRoles.map((role) => (
          <label key={role} className="role-checkbox-item">
            <input
              type="checkbox"
              checked={selectedRoles.includes(role)}
              onChange={() => handleRoleToggle(role)}
              disabled={!feature.enabled}
            />
            <span className="role-label">{getRoleLabel(role)}</span>
            <span className="role-icon">{getRoleIcon(role)}</span>
          </label>
        ))}
      </div>

      {hasChanges && (
        <div className="editor-actions">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-save"
          >
            {isSaving ? '💾 Speichert...' : '✅ Änderungen übernehmen'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="btn-cancel"
          >
            ✕ Verwerfen
          </button>
        </div>
      )}
    </div>
  );
}

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    public: 'Öffentlich',
    user: 'Angemeldete User',
    moderator: 'Moderatoren',
    admin: 'Admins',
  };
  return labels[role];
}

function getRoleIcon(role: UserRole): string {
  const icons: Record<UserRole, string> = {
    public: '🌍',
    user: '👤',
    moderator: '🧪',
    admin: '🔒',
  };
  return icons[role];
}
