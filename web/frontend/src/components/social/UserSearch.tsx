// src/components/social/UserSearch.tsx
// User Search Component with Results

import { useState } from 'react';
import { useUserSearch } from '../../hooks/useUserSearch';
import UserCard from './UserCard';

export default function UserSearch() {
  const { results, loading, debouncedSearch, clearSearch } = useUserSearch();
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      debouncedSearch(value);
    } else {
      clearSearch();
    }
  };

  return (
    <div className="user-search">
      <div className="user-search__input-wrapper">
        <span className="user-search__icon">🔍</span>
        <input
          type="text"
          className="user-search__input"
          placeholder="Suche nach Benutzern..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {query && (
          <button
            className="user-search__clear"
            onClick={() => {
              setQuery('');
              clearSearch();
            }}
          >
            ✕
          </button>
        )}
      </div>

      {loading && (
        <div className="user-search__loading">
          <span className="spinner"></span>
          Suche läuft...
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="user-search__results">
          <div className="user-search__results-header">
            {results.length} {results.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
          </div>
          {results.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <div className="user-search__no-results">
          Keine Benutzer gefunden für "{query}"
        </div>
      )}
    </div>
  );
}
