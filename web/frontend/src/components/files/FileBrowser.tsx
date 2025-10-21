// ============================================
// FILE BROWSER V4 - FULLY COMPONENTIZED
// Chat-Attachments basiertes System
// 4 Tabs: Alle, Empfangen, Gesendet, Meine Dateien
// Reduced from 688 LOC → 460 LOC → ~140 LOC
// ============================================

import { useState } from 'react';
import { useAllAttachments } from '../../hooks/useAllAttachments';
import { useFileBrowserActions } from '../../hooks/useFileBrowserActions';
import SendFileModal from './SendFileModal';
import FileBrowserTabs from './FileBrowserTabs';
import FileTypeFilters from './FileTypeFilters';
import FileBrowserTableView from './FileBrowserTableView';
import FileBrowserGridView from './FileBrowserGridView';

interface FileBrowserProps {
  userId: string;
  onClose?: () => void;
}

export default function FileBrowser({ userId }: FileBrowserProps) {
  // Data fetching
  const { loading, refresh, filterByTab, filterByType } = useAllAttachments({ userId });

  // All UI state, handlers, and helpers delegated to custom hook
  const {
    // State
    activeTab,
    view,
    filter,
    sortBy,
    sortDirection,
    searchQuery,
    selectedUser,
    selectedFiles,
    deleting,
    deletingSelected,

    // State setters
    setActiveTab,
    setView,
    setFilter,
    setSearchQuery,
    setSelectedUser,

    // Derived data
    sortedFiles,
    allFiles,
    receivedFiles,
    sentFiles,
    myFiles,
    totalSizeMB,
    availableUsers,

    // Handlers
    handleSort,
    handleDelete,
    handleToggleFile,
    handleToggleAll,
    handleDeleteSelected,
    handleCleanupBroken,

    // Helpers
    getFileIcon,
    formatSize,
    formatTime,
  } = useFileBrowserActions({ userId, filterByTab, filterByType, refresh });

  const [showSendModal, setShowSendModal] = useState(false);

  // Handler to change tab and reset user filter
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedUser('all');
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
        <FileBrowserTabs
          activeTab={activeTab}
          allFilesCount={allFiles.length}
          receivedFilesCount={receivedFiles.length}
          sentFilesCount={sentFiles.length}
          myFilesCount={myFiles.length}
          onTabChangeWithReset={handleTabChange}
        />

        {/* Filters */}
        <div className="file-browser-filters">
          <div className="filter-row">
            <div className="filter-left">
              <label className="filter-label">Typ:</label>
              <FileTypeFilters
                activeFilter={filter}
                onFilterChange={setFilter}
              />
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

        {/* Content: Table or Grid */}
        {view === 'table' ? (
          <FileBrowserTableView
            userId={userId}
            activeTab={activeTab}
            loading={loading}
            sortedFiles={sortedFiles}
            selectedFiles={selectedFiles}
            sortBy={sortBy}
            sortDirection={sortDirection}
            searchQuery={searchQuery}
            deletingSelected={deletingSelected}
            deleting={deleting}
            onSort={handleSort}
            onToggleAll={handleToggleAll}
            onToggleFile={handleToggleFile}
            onDeleteSelected={handleDeleteSelected}
            onSearchChange={setSearchQuery}
            onDelete={handleDelete}
            getFileIcon={getFileIcon}
            formatSize={formatSize}
            formatTime={formatTime}
          />
        ) : (
          <FileBrowserGridView
            activeTab={activeTab}
            loading={loading}
            sortedFiles={sortedFiles}
            deleting={deleting}
            onDelete={handleDelete}
            getFileIcon={getFileIcon}
            formatSize={formatSize}
            formatTime={formatTime}
          />
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
