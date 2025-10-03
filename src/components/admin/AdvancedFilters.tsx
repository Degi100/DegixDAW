// src/components/admin/AdvancedFilters.tsx
import type { FilterOptions } from '../../hooks/useUserFilters';

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  viewMode: 'table' | 'cards' | 'compact';
  onViewModeChange: (mode: 'table' | 'cards' | 'compact') => void;
}

export default function AdvancedFilters({ filters, onFiltersChange, viewMode, onViewModeChange }: AdvancedFiltersProps) {
  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="advanced-filters">
      <div className="filter-row">
        <select
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value as FilterOptions['status'])}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>

        <select
          value={filters.role}
          onChange={(e) => updateFilter('role', e.target.value as FilterOptions['role'])}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="user">User</option>
        </select>

        <select
          value={filters.dateRange}
          onChange={(e) => updateFilter('dateRange', e.target.value as FilterOptions['dateRange'])}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        <select
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('_');
            onFiltersChange({
              ...filters,
              sortBy: sortBy as FilterOptions['sortBy'],
              sortOrder: sortOrder as FilterOptions['sortOrder']
            });
          }}
        >
          <option value="created_at_desc">Newest First</option>
          <option value="created_at_asc">Oldest First</option>
          <option value="last_sign_in_at_desc">Recently Active</option>
          <option value="email_asc">Email A-Z</option>
          <option value="full_name_asc">Name A-Z</option>
        </select>

        <select
          value={viewMode}
          onChange={(e) => onViewModeChange(e.target.value as 'table' | 'cards' | 'compact')}
        >
          <option value="table">Table View</option>
          <option value="cards">Card View</option>
          <option value="compact">Compact View</option>
        </select>
      </div>
    </div>
  );
}