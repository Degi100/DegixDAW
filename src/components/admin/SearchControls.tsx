// src/components/admin/SearchControls.tsx
import { type RefObject } from 'react';
import Button from '../ui/Button';

interface SearchControlsProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  onCreateUser: () => void;
  onBulkActions: () => void;
  onExport: () => void;
  onAnalytics: () => void;
  selectedCount: number;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export default function SearchControls({
  searchTerm,
  onSearchChange,
  onRefresh,
  onCreateUser,
  onBulkActions,
  onExport,
  onAnalytics,
  selectedCount,
  searchInputRef
}: SearchControlsProps) {

  return (
    <div className="admin-users-controls corporate-controls">
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search users (email, name, username, phone)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="admin-search-input corporate-search"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="search-clear"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="control-actions">
        <Button onClick={onRefresh} variant="outline">
          🔄 Refresh
        </Button>

        <Button variant="primary" onClick={onCreateUser}>
          ➕ Add User
        </Button>

        {selectedCount > 0 && (
          <Button variant="secondary" onClick={onBulkActions}>
            ⚡ Bulk Actions ({selectedCount})
          </Button>
        )}

        <Button variant="outline" onClick={onExport}>
          📊 Export
        </Button>

        <Button variant="outline" onClick={onAnalytics}>
          📈 Analytics
        </Button>
      </div>
    </div>
  );
}