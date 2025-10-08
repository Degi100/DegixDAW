// ============================================
// ADMIN FEATURE FLAGS PANEL - PREMIUM EDITION
// Enterprise-grade feature management interface
// ============================================

import { useState, useMemo } from 'react';
import {
  toggleFeature,
  type FeatureFlag
} from '../../lib/constants/featureFlags';
import { useToast } from '../../hooks/useToast';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import FeatureFlagEditor from './FeatureFlagEditor';

export default function AdminFeatureFlagsPremium() {
  const { features, loading: isLoading } = useFeatureFlags();
  const { success } = useToast();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(features.map(f => f.category || 'general'));
    return ['all', ...Array.from(cats).sort()];
  }, [features]);

  // Filtered features
  const filteredFeatures = useMemo(() => {
    return features.filter(feature => {
      // Search filter
      const matchesSearch = !searchQuery ||
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === 'all' || feature.category === categoryFilter;

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'enabled' && feature.enabled) ||
        (statusFilter === 'disabled' && !feature.enabled);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [features, searchQuery, categoryFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = features.length;
    const enabled = features.filter(f => f.enabled).length;
    const publicFeatures = features.filter(f => f.enabled && f.allowedRoles.includes('public')).length;
    const adminOnly = features.filter(f => f.enabled && f.allowedRoles.length === 1 && f.allowedRoles[0] === 'admin').length;

    return { total, enabled, disabled: total - enabled, publicFeatures, adminOnly };
  }, [features]);

  // Handlers
  const handleToggle = (featureId: string, currentState: boolean) => {
    toggleFeature(featureId, !currentState);
    success(`Feature ${!currentState ? 'aktiviert' : 'deaktiviert'}`);
  };

  // Helper functions
  const getStatusColor = (feature: FeatureFlag): string => {
    if (!feature.enabled) return 'red';
    if (feature.allowedRoles.includes('public')) return 'green';
    if (feature.allowedRoles.length === 1 && feature.allowedRoles[0] === 'admin') return 'orange';
    return 'blue';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      core: '🏠',
      chat: '💬',
      social: '👥',
      files: '📂',
      cloud: '☁️',
      admin: '⚙️',
      general: '📦',
    };
    return icons[category] || '📦';
  };

  if (isLoading) {
    return (
      <div className="admin-feature-flags-premium">
        <div className="feature-flags-header">
          <h2>🎛️ Feature Management</h2>
          <p>Lade Features von Supabase...</p>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Features werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-feature-flags-premium">
      {/* Header with Stats */}
      <div className="feature-flags-header">
        <div className="header-content">
          <h2>🎛️ Feature Management</h2>
          <p>Zentrale Verwaltung aller Feature-Flags</p>
        </div>

        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Gesamt</span>
          </div>
          <div className="stat-card stat-success">
            <span className="stat-value">{stats.enabled}</span>
            <span className="stat-label">Aktiv</span>
          </div>
          <div className="stat-card stat-muted">
            <span className="stat-value">{stats.disabled}</span>
            <span className="stat-label">Inaktiv</span>
          </div>
          <div className="stat-card stat-info">
            <span className="stat-value">{stats.publicFeatures}</span>
            <span className="stat-label">Öffentlich</span>
          </div>
          <div className="stat-card stat-warning">
            <span className="stat-value">{stats.adminOnly}</span>
            <span className="stat-label">Admin-Only</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="filters-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Feature suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-group">
          <label>Kategorie:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '📋 Alle' : `${getCategoryIcon(cat)} ${cat}`}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">Alle</option>
            <option value="enabled">✅ Aktiviert</option>
            <option value="disabled">❌ Deaktiviert</option>
          </select>
        </div>

        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Tabellen-Ansicht"
          >
            ☰
          </button>
          <button
            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Karten-Ansicht"
          >
            ▦
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-info">
        Zeige {filteredFeatures.length} von {features.length} Features
      </div>

      {/* Features Table */}
      {viewMode === 'table' ? (
        <div className="features-table-container">
          <table className="features-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Kategorie</th>
                <th>Status</th>
                <th>Zugriffsrollen</th>
                <th>Version</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((feature) => (
                <tr key={feature.id} className={`feature-row ${!feature.enabled ? 'disabled' : ''}`}>
                  <td>
                    <div className="feature-info">
                      <strong>{feature.name}</strong>
                      <span className="feature-description">{feature.description}</span>
                      <code className="feature-id">{feature.id}</code>
                    </div>
                  </td>
                  <td>
                    <span className="category-badge">
                      {getCategoryIcon(feature.category)} {feature.category}
                    </span>
                  </td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={feature.enabled}
                        onChange={() => handleToggle(feature.id, feature.enabled)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <FeatureFlagEditor feature={feature} />
                  </td>
                  <td>
                    <code className="version-badge">v{feature.version}</code>
                  </td>
                  <td>
                    <span className={`status-indicator status-${getStatusColor(feature)}`}>●</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards View */
        <div className="features-grid">
          {filteredFeatures.map((feature) => (
            <div key={feature.id} className={`feature-card ${!feature.enabled ? 'disabled' : ''}`}>
              <div className="card-header">
                <span className="feature-icon">{getCategoryIcon(feature.category)}</span>
                <h3>{feature.name}</h3>
                <span className={`status-dot status-${getStatusColor(feature)}`}>●</span>
              </div>

              <p className="card-description">{feature.description}</p>

              <div className="card-meta">
                <span className="category-tag">{feature.category}</span>
                <code className="version">v{feature.version}</code>
              </div>

              <div className="card-controls">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={feature.enabled}
                    onChange={() => handleToggle(feature.id, feature.enabled)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {feature.enabled ? 'Aktiviert' : 'Deaktiviert'}
                  </span>
                </label>

                {feature.enabled && (
                  <div className="roles-section">
                    <h4>Zugriff für:</h4>
                    <FeatureFlagEditor feature={feature} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredFeatures.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>Keine Features gefunden</h3>
          <p>Versuche andere Filter oder Suchbegriffe</p>
        </div>
      )}
    </div>
  );
}
