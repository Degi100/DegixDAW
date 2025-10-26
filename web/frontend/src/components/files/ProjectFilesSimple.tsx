// ============================================
// PROJECT FILES SIMPLE
// Table view for FileBrowser Projekte tab
// Matches layout of other tabs (screenshot1.JPG)
// ============================================

import { useState } from 'react';
import { useUserFiles } from '../../hooks/useUserFiles';

interface ProjectFilesSimpleProps {
  userId: string;
}

export default function ProjectFilesSimple({ userId }: ProjectFilesSimpleProps) {
  const { files, loading, error, deleteFile } = useUserFiles(userId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Only show files that are in at least one project
  const projectFiles = files.filter(
    (f) => f.source_project_ids && f.source_project_ids.length > 0
  );

  // Filter by search query
  const filteredFiles = projectFiles.filter((file) =>
    file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get file icon
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('image/')) return '🖼️';
    return '📄';
  };

  // Format file size
  const formatSize = (bytes: number | null | undefined): string => {
    if (!bytes) return '0 B';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  // Format time
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins}m`;
    if (diffMins < 1440) return `vor ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  // Handle delete
  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`"${fileName}" löschen?`)) return;
    const success = await deleteFile(fileId);
    if (!success) alert('Fehler beim Löschen');
  };

  // Toggle file selection
  const handleToggleFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  // Toggle all
  const handleToggleAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  if (loading) {
    return (
      <div className="file-browser-table">
        <div className="loading-state">Lade Dateien...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-browser-table">
        <div className="error-state">❌ {error}</div>
      </div>
    );
  }

  if (projectFiles.length === 0) {
    return (
      <div className="file-browser-table">
        <div className="empty-state">
          <p>Keine Projekt-Dateien vorhanden</p>
          <p className="hint">Lade einen Track in ein Projekt hoch!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="file-browser-table">
      {/* Table Header */}
      <div className="table-header">
        <div className="header-cell checkbox-cell">
          <input
            type="checkbox"
            checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
            onChange={handleToggleAll}
          />
        </div>
        <div className="header-cell name-cell">Name</div>
        <div className="header-cell comment-cell">Projekte</div>
        <div className="header-cell user-cell">User</div>
        <div className="header-cell date-cell">Datum</div>
        <div className="header-cell size-cell">Größe</div>
        <div className="header-cell actions-cell">Aktionen</div>
      </div>

      {/* Search */}
      <div className="table-search">
        <input
          type="text"
          placeholder="🔍 Suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Table Body */}
      <div className="table-body">
        {filteredFiles.map((file) => (
          <div key={file.id} className="table-row">
            <div className="table-cell checkbox-cell">
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => handleToggleFile(file.id)}
              />
            </div>
            <div className="table-cell name-cell">
              <span className="file-icon">{getFileIcon(file.file_type)}</span>
              <span className="file-name">{file.file_name}</span>
            </div>
            <div className="table-cell comment-cell">
              <span className="project-badge">
                🎵 {file.source_project_ids?.length || 0}
              </span>
            </div>
            <div className="table-cell user-cell">Ich</div>
            <div className="table-cell date-cell">{formatTime(file.created_at)}</div>
            <div className="table-cell size-cell">{formatSize(file.file_size)}</div>
            <div className="table-cell actions-cell">
              <button
                className="btn-icon btn-view"
                title="Ansehen"
                onClick={() => alert('Preview coming soon!')}
              >
                👁️
              </button>
              <button
                className="btn-icon btn-info"
                title="Add to Project"
              >
                ℹ️
              </button>
              <button
                className="btn-icon btn-delete"
                title="Löschen"
                onClick={() => handleDelete(file.id, file.file_name)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
