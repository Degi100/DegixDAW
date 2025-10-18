// ============================================
// FILE BROWSER V2
// Chat-Attachments basiertes System
// 4 Tabs: Alle, Empfangen, Gesendet, Meine Dateien
// ============================================

import { useState, useEffect } from 'react';
import { useAllAttachments, type FileBrowserTab, type FileTypeFilter } from '../../hooks/useAllAttachments';
import { supabase } from '../../lib/supabase';
import SendFileModal from './SendFileModal';

interface FileBrowserProps {
  userId: string;
  onClose?: () => void;
}

export default function FileBrowser({ userId }: FileBrowserProps) {
  // Data
  const { loading, refresh, filterByTab, filterByType } = useAllAttachments({ userId });

  // UI State
  const [activeTab, setActiveTab] = useState<FileBrowserTab>('all');
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [filter, setFilter] = useState<FileTypeFilter>('all');
  const [sortBy, setSortBy] = useState<'name' | 'user' | 'date' | 'size'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showSendModal, setShowSendModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // ============================================
  // GET FILES FOR CURRENT TAB
  // ============================================
  const tabFiles = filterByTab(activeTab);
  const typeFilteredFiles = filterByType(tabFiles, filter);

  // Filter by search query (filename)
  const searchFilteredFiles = typeFilteredFiles.filter(file => {
    if (!searchQuery) return true;
    return file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter by user
  const userFilteredFiles = searchFilteredFiles.filter(file => {
    if (selectedUser === 'all') return true;
    // Check if user is sender or recipient
    return file.senderId === selectedUser || file.recipientId === selectedUser;
  });

  const sortedFiles = [...userFilteredFiles].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'name') {
      comparison = a.fileName.localeCompare(b.fileName);
    } else if (sortBy === 'user') {
      const aUser = activeTab === 'received' ? a.senderName : a.recipientName;
      const bUser = activeTab === 'received' ? b.senderName : b.recipientName;
      comparison = aUser.localeCompare(bUser);
    } else if (sortBy === 'date') {
      comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'size') {
      comparison = a.fileSize - b.fileSize;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // ============================================
  // STATS
  // ============================================
  const allFiles = filterByTab('all');
  const receivedFiles = filterByTab('received');
  const sentFiles = filterByTab('sent');
  const myFiles = filterByTab('my_files');

  const totalSize = sortedFiles.reduce((sum, file) => sum + file.fileSize, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  // ============================================
  // AVAILABLE USERS (for filter dropdown)
  // ============================================
  const availableUsers = Array.from(
    new Set(
      tabFiles.flatMap(file => {
        const users = [];
        // Don't include current user in the list
        if (file.senderId !== userId) users.push(file.senderId);
        if (file.recipientId !== userId) users.push(file.recipientId);
        return users;
      })
    )
  ).map(uid => {
    // Find the user's name from the files
    const file = tabFiles.find(f => f.senderId === uid || f.recipientId === uid);
    return {
      id: uid,
      name: file?.senderId === uid ? file.senderName : file?.recipientName || 'Unknown'
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // ============================================
  // SORTING HANDLER
  // ============================================
  const handleSort = (column: 'name' | 'user' | 'date' | 'size') => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column: default to ascending
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // ============================================
  // DELETE HANDLER
  // ============================================
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (file: typeof sortedFiles[0]) => {
    if (!confirm(`Möchtest du "${file.fileName}" für dich löschen?\n\n(Die Datei bleibt für andere User erhalten)`)) {
      return;
    }

    setDeleting(file.id);

    try {
      // Soft delete using RPC function
      const { error } = await supabase.rpc('soft_delete_attachment', {
        p_attachment_id: file.id
      });

      if (error) throw error;

      // Optimistic update: trigger refresh immediately
      refresh();
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Fehler beim Löschen der Datei');
      setDeleting(null);
    }
  };

  // Reset deleting state when file disappears from list
  useEffect(() => {
    if (deleting && !sortedFiles.find(f => f.id === deleting)) {
      setDeleting(null);
    }
  }, [sortedFiles, deleting]);

  // ============================================
  // MULTI-SELECT HANDLERS
  // ============================================
  const [deletingSelected, setDeletingSelected] = useState(false);

  const handleToggleFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (selectedFiles.size === sortedFiles.length) {
      // Deselect all
      setSelectedFiles(new Set());
    } else {
      // Select all
      setSelectedFiles(new Set(sortedFiles.map(f => f.id)));
    }
  };

  const handleDeleteSelected = async () => {
    const count = selectedFiles.size;
    if (count === 0) {
      alert('Keine Dateien ausgewählt!');
      return;
    }

    if (!confirm(`Möchtest du wirklich ${count} ausgewählte Datei${count > 1 ? 'en' : ''} für dich löschen?\n\n(Die Dateien bleiben für andere User erhalten)`)) {
      return;
    }

    setDeletingSelected(true);

    try {
      const deletePromises = Array.from(selectedFiles).map(async (fileId) => {
        try {
          const { error } = await supabase.rpc('soft_delete_attachment', {
            p_attachment_id: fileId
          });
          if (error) throw error;
        } catch (err) {
          console.error('Failed to delete file:', fileId, err);
        }
      });

      await Promise.all(deletePromises);

      setSelectedFiles(new Set());
      alert(`${count} Datei${count > 1 ? 'en' : ''} wurde${count > 1 ? 'n' : ''} für dich gelöscht.`);
    } catch (err) {
      console.error('Delete selected error:', err);
      alert('Fehler beim Löschen der Dateien');
    } finally {
      setDeletingSelected(false);
    }
  };

  // ============================================
  // CLEANUP BROKEN FILES (files in DB but not in Storage)
  // ============================================
  const handleCleanupBroken = async () => {
    // Find files without signed URLs (broken storage links)
    const brokenFiles = sortedFiles.filter(f => !f.signedUrl);

    if (brokenFiles.length === 0) {
      alert('Keine kaputten Dateien gefunden!');
      return;
    }

    if (!confirm(`${brokenFiles.length} Dateien sind kaputt (existieren in DB aber nicht im Storage).\n\nMöchtest du diese für dich ausblenden?`)) {
      return;
    }

    setDeletingSelected(true);

    try {
      const deletePromises = brokenFiles.map(async (file) => {
        const { error } = await supabase.rpc('soft_delete_attachment', {
          p_attachment_id: file.id
        });

        if (error) {
          console.error('Failed to delete broken file:', file.fileName, error);
        }
      });

      await Promise.all(deletePromises);

      alert(`${brokenFiles.length} kaputte Einträge wurden für dich ausgeblendet.`);
    } catch (err) {
      console.error('Cleanup error:', err);
      alert('Fehler beim Aufräumen');
    } finally {
      setDeletingSelected(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📕';
    if (type.includes('word')) return '📄';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('text')) return '📝';
    return '📁';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min`;
    if (diffHours < 24) return `vor ${diffHours} Std`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;

    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="file-browser">
        {/* Header */}
        <div className="file-browser-header">
          <div className="file-browser-title">
            <h2>📂 Meine Dateien</h2>
            <button className="btn-upload-compact" onClick={() => setShowSendModal(true)}>
              📤 Hochladen / Versenden
            </button>
          </div>
          <div className="header-actions">
            {sortedFiles.some(f => !f.signedUrl) && (
              <button
                className="btn-cleanup"
                onClick={handleCleanupBroken}
                disabled={deletingSelected}
                title="Kaputte Einträge entfernen"
              >
                🧹 Cleanup
              </button>
            )}
          </div>
        </div>


        {/* Tabs */}
        <div className="file-browser-tabs">
          <button
            className={`file-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('all');
              setSelectedUser('all');
            }}
          >
            Alle
            <span className="file-tab-count">{allFiles.length}</span>
          </button>
          <button
            className={`file-tab ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('received');
              setSelectedUser('all');
            }}
          >
            📥 Empfangen
            <span className="file-tab-count">{receivedFiles.length}</span>
          </button>
          <button
            className={`file-tab ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('sent');
              setSelectedUser('all');
            }}
          >
            📤 Gesendet
            <span className="file-tab-count">{sentFiles.length}</span>
          </button>
          <button
            className={`file-tab ${activeTab === 'my_files' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('my_files');
              setSelectedUser('all');
            }}
          >
            📁 Meine
            <span className="file-tab-count">{myFiles.length}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="file-browser-filters">
          <div className="filter-row">
            <div className="filter-left">
              <label className="filter-label">Typ:</label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filter === 'images' ? 'active' : ''}`}
                  onClick={() => setFilter('images')}
                >
                  🖼️
                </button>
                <button
                  className={`filter-btn ${filter === 'videos' ? 'active' : ''}`}
                  onClick={() => setFilter('videos')}
                >
                  🎥
                </button>
                <button
                  className={`filter-btn ${filter === 'audio' ? 'active' : ''}`}
                  onClick={() => setFilter('audio')}
                >
                  🎵
                </button>
                <button
                  className={`filter-btn ${filter === 'documents' ? 'active' : ''}`}
                  onClick={() => setFilter('documents')}
                >
                  📄
                </button>
              </div>
            </div>

            <div className="filter-right">

              <div className="filter-stats">
                <span>{sortedFiles.length} Dateien • {totalSizeMB} MB</span>
              </div>

              {activeTab !== 'my_files' && availableUsers.length > 0 && (
                <div className="filter-user">
                  <label className="filter-label">User:</label>
                  <select
                    className="user-select"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  >
                    <option value="all">Alle User</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="filter-view">
                <button
                  className={`view-btn ${view === 'table' ? 'active' : ''}`}
                  onClick={() => setView('table')}
                  title="Tabelle"
                >
                  ☰
                </button>
                <button
                  className={`view-btn ${view === 'grid' ? 'active' : ''}`}
                  onClick={() => setView('grid')}
                  title="Grid"
                >
                  ⊞
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {view === 'table' ? (
          <div className="file-browser-table">
          {/* Table Header */}
          <div className="table-header">
            <div className="table-header-cell table-col-checkbox">
              <input
                type="checkbox"
                checked={sortedFiles.length > 0 && selectedFiles.size === sortedFiles.length}
                onChange={handleToggleAll}
                title="Alle auswählen"
              />
            </div>
            <div className="table-header-cell table-col-name" onClick={() => handleSort('name')}>
              Name {sortBy === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
            </div>
            <div className="table-header-cell table-col-comment">Kommentar</div>
            <div className="table-header-cell table-col-user" onClick={() => handleSort('user')}>
              {activeTab === 'received' ? 'Sender' : activeTab === 'sent' ? 'Empfänger' : 'User'}
              {sortBy === 'user' && (sortDirection === 'asc' ? '▲' : '▼')}
            </div>
            <div className="table-header-cell table-col-date" onClick={() => handleSort('date')}>
              Datum {sortBy === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
            </div>
            <div className="table-header-cell table-col-size" onClick={() => handleSort('size')}>
              Größe {sortBy === 'size' && (sortDirection === 'asc' ? '▲' : '▼')}
            </div>
            <div className="table-header-cell table-col-actions">Aktionen</div>
          </div>

          {/* Search Row */}
          <div className="table-search-row">
            <div className="table-search-cell table-col-checkbox">
              {selectedFiles.size > 0 && (
                <button
                  className="btn-delete-selected"
                  onClick={handleDeleteSelected}
                  disabled={deletingSelected}
                  title={`${selectedFiles.size} Dateien löschen`}
                >
                  {deletingSelected ? '⏳' : `🗑️ ${selectedFiles.size}`}
                </button>
              )}
            </div>
            <div className="table-search-cell table-col-name">
              <input
                type="text"
                className="table-search-input"
                placeholder="🔍 Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="table-search-cell table-col-comment"></div>
            <div className="table-search-cell table-col-user"></div>
            <div className="table-search-cell table-col-date"></div>
            <div className="table-search-cell table-col-size"></div>
            <div className="table-search-cell table-col-actions"></div>
          </div>

          {/* Table Body */}
          <div className="table-body">
            {loading ? (
              <div className="table-empty">
                <div className="spinner"></div>
                <p>Lade Dateien...</p>
              </div>
            ) : sortedFiles.length === 0 ? (
              <div className="table-empty">
                <p>📭 Keine Dateien gefunden</p>
                {activeTab === 'all' && <small>Lade Dateien hoch oder empfange welche</small>}
                {activeTab === 'received' && <small>Noch keine Dateien empfangen</small>}
                {activeTab === 'sent' && <small>Noch keine Dateien gesendet</small>}
                {activeTab === 'my_files' && <small>Noch keine persönlichen Dateien</small>}
              </div>
            ) : (
              sortedFiles.map((file) => (
                <div key={file.id} className="table-row">
                  {/* Checkbox */}
                  <div className="table-cell table-col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => handleToggleFile(file.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Name */}
                  <div className="table-cell table-col-name">
                    <span className="file-icon">{getFileIcon(file.fileType)}</span>
                    <span className="file-name" title={file.fileName}>{file.fileName}</span>
                  </div>

                  {/* Comment */}
                  <div className="table-cell table-col-comment" title={file.messageContent || ''}>
                    {file.messageContent || ''}
                  </div>

                  {/* User */}
                  <div className="table-cell table-col-user">
                    {activeTab === 'received' && file.senderName}
                    {activeTab === 'sent' && file.recipientName}
                    {activeTab === 'all' && (file.senderId === userId ? `→ ${file.recipientName}` : `← ${file.senderName}`)}
                    {activeTab === 'my_files' && 'Ich'}
                  </div>

                  {/* Date */}
                  <div className="table-cell table-col-date">
                    {formatTime(file.createdAt)}
                  </div>

                  {/* Size */}
                  <div className="table-cell table-col-size">
                    {formatSize(file.fileSize)}
                  </div>

                  {/* Actions */}
                  <div className="table-cell table-col-actions">
                    {file.signedUrl ? (
                      <>
                        <a
                          href={file.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="table-action-btn"
                          title="Öffnen"
                        >
                          👁️
                        </a>
                        <a
                          href={file.signedUrl}
                          download={file.fileName}
                          className="table-action-btn"
                          title="Download"
                        >
                          ⬇️
                        </a>
                        <button
                          onClick={() => handleDelete(file)}
                          className="table-action-btn table-action-btn--delete"
                          title="Löschen"
                          disabled={deleting === file.id}
                        >
                          {deleting === file.id ? '⏳' : '🗑️'}
                        </button>
                      </>
                    ) : (
                      <span className="table-action-btn" title="Lädt...">⏳</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        ) : (
          <div className="file-browser-grid">
            {loading ? (
              <div className="grid-empty">
                <div className="spinner"></div>
                <p>Lade Dateien...</p>
              </div>
            ) : sortedFiles.length === 0 ? (
              <div className="grid-empty">
                <p>📭 Keine Dateien gefunden</p>
                {activeTab === 'all' && <small>Lade Dateien hoch oder empfange welche</small>}
                {activeTab === 'received' && <small>Noch keine Dateien empfangen</small>}
                {activeTab === 'sent' && <small>Noch keine Dateien gesendet</small>}
                {activeTab === 'my_files' && <small>Noch keine persönlichen Dateien</small>}
              </div>
            ) : (
              sortedFiles.map((file) => (
                <div key={file.id} className="grid-item">
                  <div className="grid-item-preview">
                    {file.fileType.startsWith('image/') ? (
                      file.signedThumbnailUrl || file.signedUrl ? (
                        <img src={file.signedThumbnailUrl || file.signedUrl || ''} alt={file.fileName} />
                      ) : (
                        <div className="grid-item-icon">⏳</div>
                      )
                    ) : file.fileType.startsWith('video/') && file.signedThumbnailUrl ? (
                      <img src={file.signedThumbnailUrl} alt={file.fileName} />
                    ) : (
                      <div className="grid-item-icon">{getFileIcon(file.fileType)}</div>
                    )}
                  </div>

                  <div className="grid-item-info">
                    <div className="grid-item-name" title={file.fileName}>{file.fileName}</div>

                    {file.messageContent && (
                      <div className="grid-item-comment" title={file.messageContent}>
                        {file.messageContent}
                      </div>
                    )}

                    {activeTab === 'received' && (
                      <div className="grid-item-user">Von: {file.senderName}</div>
                    )}
                    {activeTab === 'sent' && (
                      <div className="grid-item-user">An: {file.recipientName}</div>
                    )}

                    <div className="grid-item-meta">
                      <span>{formatSize(file.fileSize)}</span>
                      <span>•</span>
                      <span>{formatTime(file.createdAt)}</span>
                    </div>
                  </div>

                  <div className="grid-item-actions">
                    {file.signedUrl ? (
                      <>
                        <a href={file.signedUrl} target="_blank" rel="noopener noreferrer" className="grid-action-btn" title="Öffnen">
                          👁️
                        </a>
                        <a href={file.signedUrl} download={file.fileName} className="grid-action-btn" title="Download">
                          ⬇️
                        </a>
                        <button onClick={() => handleDelete(file)} className="grid-action-btn grid-action-btn--delete" title="Löschen" disabled={deleting === file.id}>
                          {deleting === file.id ? '⏳' : '🗑️'}
                        </button>
                      </>
                    ) : (
                      <span className="grid-action-btn" title="Lädt...">⏳</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Send File Modal */}
      {showSendModal && (
        <SendFileModal
          userId={userId}
          onClose={() => setShowSendModal(false)}
          onSuccess={() => refresh()}
        />
      )}
    </>
  );
}
