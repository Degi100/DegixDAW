// ============================================
// ADMIN FEATURE FLAGS PANEL
// Toggle features on/off in production
// ============================================

import { useState, useEffect } from 'react';
import { getAllFeatures, toggleFeature, type FeatureFlag } from '../../lib/constants/featureFlags';
import { useToast } from '../../hooks/useToast';

export default function AdminFeatureFlags() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = () => {
    const allFeatures = getAllFeatures();
    setFeatures(allFeatures);
  };

  const handleToggle = async (featureId: string, currentState: boolean) => {
    try {
      setLoading(true);
      
      // Toggle in memory
      toggleFeature(featureId, !currentState);
      
      // TODO: Persist to Supabase
      // await supabase
      //   .from('feature_flags')
      //   .upsert({ id: featureId, enabled: !currentState });
      
      // Reload
      loadFeatures();
      success(`Feature ${!currentState ? 'aktiviert' : 'deaktiviert'}`);
    } catch (err) {
      console.error('Toggle error:', err);
      showError('Fehler beim Umschalten');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (feature: FeatureFlag) => {
    if (!feature.enabled) return '❌';
    if (feature.adminOnly) return '🔒';
    if (feature.betaAccess) return '🧪';
    return '✅';
  };

  const getStatusText = (feature: FeatureFlag) => {
    if (!feature.enabled) return 'Deaktiviert';
    if (feature.adminOnly) return 'Nur Admins';
    if (feature.betaAccess) return 'Beta-Tester';
    return 'Öffentlich';
  };

  const getStatusColor = (feature: FeatureFlag) => {
    if (!feature.enabled) return 'red';
    if (feature.adminOnly) return 'orange';
    if (feature.betaAccess) return 'blue';
    return 'green';
  };

  return (
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
              {feature.adminOnly && (
                <span className="feature-badge admin">Admin-Only</span>
              )}
              {feature.betaAccess && (
                <span className="feature-badge beta">Beta</span>
              )}
            </div>

            <div className="feature-controls">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={feature.enabled}
                  onChange={() => handleToggle(feature.id, feature.enabled)}
                  disabled={loading}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">
                  {feature.enabled ? 'Aktiviert' : 'Deaktiviert'}
                </span>
              </label>

              {feature.enabled && (
                <div className="visibility-controls">
                  <label>
                    <input
                      type="radio"
                      name={`${feature.id}-visibility`}
                      checked={!feature.adminOnly && !feature.betaAccess}
                      readOnly
                    />
                    Öffentlich
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`${feature.id}-visibility`}
                      checked={feature.betaAccess}
                      readOnly
                    />
                    Beta-Tester
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`${feature.id}-visibility`}
                      checked={feature.adminOnly}
                      readOnly
                    />
                    Nur Admins
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
          <li><strong>✅ Öffentlich:</strong> Feature ist für alle User sichtbar</li>
          <li><strong>🧪 Beta-Tester:</strong> Nur ausgewählte User (beta_access flag)</li>
          <li><strong>🔒 Nur Admins:</strong> Nur du siehst das Feature (zum Testen)</li>
          <li><strong>❌ Deaktiviert:</strong> Feature ist komplett versteckt</li>
        </ul>
      </div>
    </div>
  );
}
