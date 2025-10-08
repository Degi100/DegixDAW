// ============================================
// ADMIN FEATURE FLAGS PANEL
// Toggle features on/off in production
// ============================================

import { useState, useEffect } from 'react';
import {
  getAllFeatures,
  toggleFeature,
  updateAllowedRoles,
  type FeatureFlag,
  type UserRole
} from '../../lib/constants/featureFlags';
import { useToast } from '../../hooks/useToast';
import AdminLayoutCorporate from './AdminLayoutCorporate';

export default function AdminFeatureFlags() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const { success } = useToast();

  // Load features on initial component mount
  useEffect(() => {
    console.log('%c[AdminFeatureFlags] Component mounted. Getting initial features...', 'color: #8b5cf6');
    const initialFeatures = getAllFeatures();
    console.log('%c[AdminFeatureFlags] Received initial features:', 'color: #8b5cf6', initialFeatures);
    setFeatures(initialFeatures);
  }, []);

  const handleToggle = (featureId: string, currentState: boolean) => {
    console.log(`%c[AdminFeatureFlags] handleToggle called for id: ${featureId}, current state: ${currentState}`, 'color: #ef4444');
    // 1. Call the central function to update storage and dispatch event
    toggleFeature(featureId, !currentState);
    // 2. Directly reload the state for this component from the source of truth
    const updatedFeatures = getAllFeatures();
    console.log('%c[AdminFeatureFlags] Reloaded features after toggle:', 'color: #22c55e', updatedFeatures);
    setFeatures(updatedFeatures);
    success(`Feature ${!currentState ? 'aktiviert' : 'deaktiviert'}`);
  };

  const handleRoleToggle = (featureId: string, role: UserRole, currentRoles: UserRole[]) => {
    console.log(`%c[AdminFeatureFlags] handleRoleToggle called for id: ${featureId}, role: ${role}`, 'color: #ef4444');
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

    // 1. Call the central function
    updateAllowedRoles(featureId, newRoles);
    // 2. Directly reload the state for this component
    const updatedFeatures = getAllFeatures();
    console.log('%c[AdminFeatureFlags] Reloaded features after role change:', 'color: #22c55e', updatedFeatures);
    setFeatures(updatedFeatures);
    success(`Rolle ${role} ${newRoles.includes(role) ? 'hinzugefügt' : 'entfernt'}`);
  };

  const getStatusIcon = (feature: FeatureFlag) => {
    if (!feature.enabled) return '❌';
    if (feature.allowedRoles.includes('public')) return '🌍';
    if (feature.allowedRoles.includes('admin') && feature.allowedRoles.length === 1) return '🔒';
    if (feature.allowedRoles.includes('moderator')) return '🧪';
    return '✅';
  };

  const getStatusText = (feature: FeatureFlag) => {
    if (!feature.enabled) return 'Deaktiviert';
    if (feature.allowedRoles.includes('public')) return 'Öffentlich';
    if (feature.allowedRoles.includes('admin') && feature.allowedRoles.length === 1) return 'Nur Admins';
    if (feature.allowedRoles.includes('moderator')) return 'Moderatoren';
    return `${feature.allowedRoles.length} Rollen`;
  };

  const getStatusColor = (feature: FeatureFlag) => {
    if (!feature.enabled) return '#ef4444'; // red
    if (feature.allowedRoles.includes('public')) return '#22c55e'; // green
    if (feature.allowedRoles.includes('admin') && feature.allowedRoles.length === 1) return '#f97316'; // orange
    if (feature.allowedRoles.includes('moderator')) return '#3b82f6'; // blue
    return '#8b5cf6'; // purple
  };

  return (
    <AdminLayoutCorporate>
      <div className="admin-feature-flags">
        <div className="admin-section-header">
          <h2>🎛️ Feature-Flags</h2>
          <p>Steuere, welche Features live sind und wer sie sieht</p>
        </div>

        <div className="feature-flags-grid">
          {features.map((feature) => (
            <div key={feature.id} className="feature-flag-card">
              <div className="feature-flag-header">
                <div className="feature-flag-title">
                  <span className="feature-icon">{getStatusIcon(feature)}</span>
                  <h3>{feature.name}</h3>
                </div>
                <span
                  className="feature-status"
                  style={{
                    color: `var(--color-${getStatusColor(feature)})`,
                    background: `rgba(var(--color-${getStatusColor(feature)}-rgb), 0.1)`,
                  }}
                >
                  {getStatusText(feature)}
                </span>
              </div>

              <p className="feature-description">{feature.description}</p>

              <div className="feature-meta">
                <span className="feature-version">v{feature.version}</span>
                <span className="feature-roles">
                  {feature.allowedRoles.length} {feature.allowedRoles.length === 1 ? 'Rolle' : 'Rollen'}
                </span>
              </div>

              <div className="feature-controls">
                <label className="feature-toggle">
                  <input
                    type="checkbox"
                    checked={feature.enabled}
                    onChange={() => handleToggle(feature.id, feature.enabled)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {feature.enabled ? '✅ Aktiviert' : '❌ Deaktiviert'}
                  </span>
                </label>

                {feature.enabled && (
                  <div className="role-checkboxes">
                    <h4>Zugriff für:</h4>
                    <label className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={feature.allowedRoles.includes('public')}
                        onChange={() => handleRoleToggle(feature.id, 'public', feature.allowedRoles)}
                      />
                      <span className="role-icon">🌍</span>
                      <span>Öffentlich (alle Besucher)</span>
                    </label>
                    <label className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={feature.allowedRoles.includes('user')}
                        onChange={() => handleRoleToggle(feature.id, 'user', feature.allowedRoles)}
                      />
                      <span className="role-icon">👤</span>
                      <span>User (angemeldet)</span>
                    </label>
                    <label className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={feature.allowedRoles.includes('moderator')}
                        onChange={() => handleRoleToggle(feature.id, 'moderator', feature.allowedRoles)}
                      />
                      <span className="role-icon">🧪</span>
                      <span>Moderatoren (Beta-Tester)</span>
                    </label>
                    <label className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={feature.allowedRoles.includes('admin')}
                        onChange={() => handleRoleToggle(feature.id, 'admin', feature.allowedRoles)}
                      />
                      <span className="role-icon">🔒</span>
                      <span>Admins (nur du)</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="admin-info-box">
          <h4>ℹ️ Info</h4>
          <ul>
            <li><strong>🌍 Öffentlich:</strong> Alle Besucher sehen das Feature (auch ohne Login)</li>
            <li><strong>👤 User:</strong> Nur angemeldete User</li>
            <li><strong>🧪 Moderatoren:</strong> Beta-Tester & Moderatoren (für Pre-Release Testing)</li>
            <li><strong>🔒 Admins:</strong> Nur Administratoren</li>
          </ul>
        </div>
      </div>
    </AdminLayoutCorporate>
  );
}
