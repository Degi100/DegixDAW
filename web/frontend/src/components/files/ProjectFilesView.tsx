// ============================================
// PROJECT FILES VIEW
// Test component for user_files integration
// Shows files that are in projects
// ============================================

import { useUserFiles } from '../../hooks/useUserFiles';
import AddToProjectButton from './AddToProjectButton';

interface ProjectFilesViewProps {
  userId: string;
}

export default function ProjectFilesView({ userId }: ProjectFilesViewProps) {
  const {
    filteredFiles,
    groupedFiles,
    loading,
    error,
    filter,
    setFilter,
    groupByProject,
    setGroupByProject,
    deleteFile,
  } = useUserFiles(userId);

  // Get file icon based on MIME type
  const getFileIcon = (mimeType: string): string => {
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('image/')) return '🖼️';
    return '📄';
  };

  // Format file size
  const formatSize = (bytes: number | null | undefined): string => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  // Format timestamp
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins}m`;
    if (diffMins < 1440) return `vor ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Get source badge
  const getSourceBadge = (source: string): { icon: string; label: string; color: string } => {
    switch (source) {
      case 'chat':
        return { icon: '💬', label: 'Chat', color: '#3b82f6' };
      case 'upload':
        return { icon: '📁', label: 'Upload', color: '#10b981' };
      case 'project':
        return { icon: '🎵', label: 'Project', color: '#8b5cf6' };
      default:
        return { icon: '📄', label: 'Unknown', color: '#6b7280' };
    }
  };

  // Handle delete
  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;
    const success = await deleteFile(fileId);
    if (success) {
      console.log('File deleted:', fileName);
    } else {
      alert('Failed to delete file');
    }
  };

  if (loading) {
    return (
      <div className="project-files-view">
        <div className="loading">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-files-view">
        <div className="error">❌ {error}</div>
      </div>
    );
  }

  return (
    <div className="project-files-view">
      {/* Header */}
      <div className="project-files-header">
        <h2>🎵 Project Files</h2>
        <div className="header-stats">
          {filteredFiles.length} files
        </div>
      </div>

      {/* Filters */}
      <div className="project-files-filters">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'received' ? 'active' : ''}`}
            onClick={() => setFilter('received')}
          >
            📥 Received
          </button>
          <button
            className={`filter-tab ${filter === 'sent' ? 'active' : ''}`}
            onClick={() => setFilter('sent')}
          >
            📤 Sent
          </button>
          <button
            className={`filter-tab ${filter === 'mine' ? 'active' : ''}`}
            onClick={() => setFilter('mine')}
          >
            📁 Mine
          </button>
          <button
            className={`filter-tab ${filter === 'projects' ? 'active' : ''}`}
            onClick={() => setFilter('projects')}
          >
            🎵 Projects
          </button>
        </div>

        {filter === 'all' && (
          <div className="grouping-toggle">
            <label>
              <input
                type="checkbox"
                checked={groupByProject}
                onChange={(e) => setGroupByProject(e.target.checked)}
              />
              Group by Project
            </label>
          </div>
        )}
      </div>

      {/* Content */}
      {groupedFiles ? (
        // Grouped view
        <div className="project-files-grouped">
          {Object.entries(groupedFiles).map(([projectId, group]) => (
            <div key={projectId} className="project-group">
              <h3 className="project-group-title">
                {projectId === 'uncategorized' ? '📂' : '🎵'} {group.projectTitle}
                <span className="file-count">({group.files.length})</span>
              </h3>
              <div className="project-group-files">
                {group.files.map((file) => {
                  const badge = getSourceBadge(file.source);
                  return (
                    <div key={file.id} className="file-item">
                      <div className="file-icon">{getFileIcon(file.file_type)}</div>
                      <div className="file-info">
                        <div className="file-name">{file.file_name}</div>
                        <div className="file-meta">
                          <span className="file-size">{formatSize(file.file_size)}</span>
                          <span className="file-time">{formatTime(file.created_at)}</span>
                          <span
                            className="file-badge"
                            style={{ backgroundColor: badge.color }}
                            title={`Source: ${badge.label}`}
                          >
                            {badge.icon} {badge.label}
                          </span>
                        </div>
                      </div>
                      <div className="file-actions">
                        {/* Only show Add to Project if file is not in projects or in "mine" filter */}
                        {(filter === 'mine' || !file.source_project_ids || file.source_project_ids.length === 0) && (
                          <AddToProjectButton
                            fileName={file.file_name}
                            fileType={file.file_type}
                            fileSize={file.file_size || 0}
                            userFileId={file.id}
                          />
                        )}
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(file.id, file.file_name)}
                          title="Delete file"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List view
        <div className="project-files-list">
          {filteredFiles.length === 0 ? (
            <div className="empty-state">
              <p>No files found</p>
              {filter === 'projects' && (
                <p className="hint">Upload a track to a project to see it here!</p>
              )}
            </div>
          ) : (
            filteredFiles.map((file) => {
              const badge = getSourceBadge(file.source);
              return (
                <div key={file.id} className="file-item">
                  <div className="file-icon">{getFileIcon(file.file_type)}</div>
                  <div className="file-info">
                    <div className="file-name">{file.file_name}</div>
                    <div className="file-meta">
                      <span className="file-size">{formatSize(file.file_size)}</span>
                      <span className="file-time">{formatTime(file.created_at)}</span>
                      <span
                        className="file-badge"
                        style={{ backgroundColor: badge.color }}
                        title={`Source: ${badge.label}`}
                      >
                        {badge.icon} {badge.label}
                      </span>
                      {file.source_project_ids && file.source_project_ids.length > 0 && (
                        <span className="projects-count" title="Used in projects">
                          🎵 {file.source_project_ids.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="file-actions">
                    <AddToProjectButton
                      fileName={file.file_name}
                      fileType={file.file_type}
                      fileSize={file.file_size || 0}
                      userFileId={file.id}
                    />
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(file.id, file.file_name)}
                      title="Delete file"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
