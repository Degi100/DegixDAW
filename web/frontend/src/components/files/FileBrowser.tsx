// ============================================
// FILE BROWSER V4 - FULLY COMPONENTIZED
// Chat-Attachments basiertes System
// 4 Tabs: Alle, Empfangen, Gesendet, Meine Dateien
// Reduced from 688 LOC → 460 LOC → ~140 LOC
// ============================================

import { useState, useEffect } from 'react';
import { useAllAttachments } from '../../hooks/useAllAttachments';
import { useFileBrowserActions } from '../../hooks/useFileBrowserActions';
import { useUserFiles } from '../../hooks/useUserFiles';
import { supabase } from '../../lib/supabase';
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
  // Data fetching - Chat Attachments
  const { loading, refresh, filterByTab, filterByType } = useAllAttachments({ userId });

  // Data fetching - Project Files
  const { files: userFiles, loading: projectsLoading, refresh: refreshUserFiles } = useUserFiles(userId);

  // Load project names for display
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});

  // Fetch project names
  useEffect(() => {
    const fetchProjectNames = async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, title')
        .eq('creator_id', userId);

      if (data) {
        const names: Record<string, string> = {};
        data.forEach((p) => {
          names[p.id] = p.title;
        });
        setProjectNames(names);
      }
    };

    fetchProjectNames();
  }, [userId]);

  // Convert UserFile[] to AttachmentItem[] format for TableView
  const projectFiles = userFiles
    .filter((f) => f.source_project_ids && f.source_project_ids.length > 0)
    .map((file) => {
      // Get project names for this file
      const projectTitles = file.source_project_ids
        ?.map((pid) => projectNames[pid] || 'Unknown')
        .join(', ') || '';

      return {
        id: file.id,
        messageId: '', // Not from message
        conversationId: '',
        fileName: file.file_name,
        fileType: file.file_type,
        fileSize: file.file_size || 0,
        fileUrl: file.file_path,
        signedUrl: undefined, // TODO: Generate signed URL
        thumbnailUrl: undefined,
        signedThumbnailUrl: undefined,
        width: null,
        height: null,
        duration: file.duration_ms || null,
        createdAt: file.created_at,
        senderId: file.user_id, // Changed from uploaded_by
        senderName: 'Ich', // Always show "Ich" for own files
        recipientId: userId,
        recipientName: 'Ich',
        messageContent: projectTitles,
        sourceProjectIds: file.source_project_ids || [], // Pass through for filtering
      };
    });

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
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // Handler to change tab and reset user filter
  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedUser('all');
  };

  // Delete handler for Projects tab (removes from all projects)
  const handleDeleteProjectFile = async (file: any) => {
    if (!confirm(`Delete "${file.fileName}" from all projects?`)) return;

    setDeletingFile(file.id);
    try {
      const { deleteUserFile } = await import('../../lib/services/files/userFilesService');
      const success = await deleteUserFile(file.id);

      if (success) {
        refreshUserFiles();
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete file');
    } finally {
      setDeletingFile(null);
    }
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
          projectFilesCount={projectFiles.length}
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
                <span>
                  {activeTab === 'projects' ? projectFiles.length : sortedFiles.length} Dateien • {activeTab === 'projects' ? (projectFiles.reduce((sum, f) => sum + (f.fileSize || 0), 0) / (1024 * 1024)).toFixed(2) : totalSizeMB} MB
                </span>
              </div>

              {activeTab !== 'my_files' && activeTab !== 'projects' && availableUsers.length > 0 && (
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

        {/* Content: Table or Grid View (same for all tabs including projects) */}
        {view === 'table' ? (
          <FileBrowserTableView
            userId={userId}
            activeTab={activeTab}
            loading={activeTab === 'projects' ? projectsLoading : loading}
            sortedFiles={activeTab === 'projects' ? projectFiles : sortedFiles}
            selectedFiles={selectedFiles}
            sortBy={sortBy}
            sortDirection={sortDirection}
            searchQuery={searchQuery}
            deletingSelected={deletingSelected}
            deleting={activeTab === 'projects' ? deletingFile : deleting}
            onSort={handleSort}
            onToggleAll={handleToggleAll}
            onToggleFile={handleToggleFile}
            onDeleteSelected={handleDeleteSelected}
            onSearchChange={setSearchQuery}
            onDelete={activeTab === 'projects' ? handleDeleteProjectFile : handleDelete}
            getFileIcon={getFileIcon}
            formatSize={formatSize}
            formatTime={formatTime}
            onRefreshProjects={refreshUserFiles}
          />
        ) : (
          <FileBrowserGridView
            activeTab={activeTab}
            loading={activeTab === 'projects' ? projectsLoading : loading}
            sortedFiles={activeTab === 'projects' ? projectFiles : sortedFiles}
            deleting={activeTab === 'projects' ? deletingFile : deleting}
            onDelete={activeTab === 'projects' ? handleDeleteProjectFile : handleDelete}
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
