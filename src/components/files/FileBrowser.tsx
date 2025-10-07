// ============================================
// FILE BROWSER - DELUXE EDITION
// User's Personal File Hub & Cloud Integration
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { MAX_FILE_SIZE_MB } from '../../lib/constants/storage';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  conversationId?: string;
  messageId?: string;
}

interface FileBrowserProps {
  userId: string;
  onClose?: () => void;
}

export default function FileBrowser({ userId, onClose }: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'images' | 'videos' | 'audio' | 'documents'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const { error: showError } = useToast();

  // Load user's files
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);

      // Get all message attachments for user's conversations
      const { data: attachments, error: fetchError } = await supabase
        .from('message_attachments')
        .select(`
          id,
          file_name,
          file_size,
          file_type,
          file_url,
          thumbnail_url,
          created_at,
          message:messages!inner (
            id,
            conversation_id,
            conversations:conversations!inner (
              conversation_members!inner (
                user_id
              )
            )
          )
        `)
        .eq('message.conversations.conversation_members.user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const fileItems: FileItem[] = (attachments || []).map((att: any) => ({
        id: att.id,
        name: att.file_name,
        size: att.file_size || 0,
        type: att.file_type,
        url: att.file_url,
        thumbnailUrl: att.thumbnail_url,
        createdAt: att.created_at,
        messageId: att.message?.id,
        conversationId: att.message?.conversation_id,
      }));

      setFiles(fileItems);
    } catch (err) {
      console.error('Error loading files:', err);
      showError('Fehler beim Laden der Dateien');
    } finally {
      setLoading(false);
    }
  }, [userId, showError]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Filter files
  const filteredFiles = files.filter((file) => {
    if (filter === 'all') return true;
    if (filter === 'images') return file.type.startsWith('image/');
    if (filter === 'videos') return file.type.startsWith('video/');
    if (filter === 'audio') return file.type.startsWith('audio/');
    if (filter === 'documents') return file.type.startsWith('application/') || file.type.startsWith('text/');
    return true;
  });

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'size') return b.size - a.size;
    return 0;
  });

  // Calculate total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  // Get file category icon
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="file-browser">
      {/* Header */}
      <div className="file-browser-header">
        <div className="file-browser-title">
          <h2>📂 Meine Dateien</h2>
          <button className="file-browser-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="file-browser-stats">
          <span className="file-stat">
            <strong>{files.length}</strong> Dateien
          </span>
          <span className="file-stat">
            <strong>{totalSizeMB} MB</strong> gesamt
          </span>
          <span className="file-stat">
            <strong>{MAX_FILE_SIZE_MB} MB</strong> pro Datei
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="file-browser-controls">
        {/* Filter */}
        <div className="file-browser-filter">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Alle
          </button>
          <button
            className={`filter-btn ${filter === 'images' ? 'active' : ''}`}
            onClick={() => setFilter('images')}
          >
            🖼️ Bilder
          </button>
          <button
            className={`filter-btn ${filter === 'videos' ? 'active' : ''}`}
            onClick={() => setFilter('videos')}
          >
            🎥 Videos
          </button>
          <button
            className={`filter-btn ${filter === 'audio' ? 'active' : ''}`}
            onClick={() => setFilter('audio')}
          >
            🎵 Audio
          </button>
          <button
            className={`filter-btn ${filter === 'documents' ? 'active' : ''}`}
            onClick={() => setFilter('documents')}
          >
            📄 Dokumente
          </button>
        </div>

        {/* Sort & View */}
        <div className="file-browser-actions">
          <select
            className="file-browser-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
          >
            <option value="date">Datum</option>
            <option value="name">Name</option>
            <option value="size">Größe</option>
          </select>

          <div className="file-browser-view-toggle">
            <button
              className={`view-btn ${view === 'grid' ? 'active' : ''}`}
              onClick={() => setView('grid')}
              title="Grid-Ansicht"
            >
              ⊞
            </button>
            <button
              className={`view-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
              title="Listen-Ansicht"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Files */}
      <div className={`file-browser-content file-browser-content--${view}`}>
        {loading ? (
          <div className="file-browser-loading">
            <div className="spinner"></div>
            <p>Lade Dateien...</p>
          </div>
        ) : sortedFiles.length === 0 ? (
          <div className="file-browser-empty">
            <p>📭 Keine Dateien gefunden</p>
            <small>Lade Dateien im Chat hoch, um sie hier zu sehen</small>
          </div>
        ) : (
          sortedFiles.map((file) => (
            <div key={file.id} className="file-item">
              {/* Preview */}
              <div className="file-item-preview">
                {file.type.startsWith('image/') ? (
                  <img src={file.thumbnailUrl || file.url} alt={file.name} />
                ) : file.type.startsWith('video/') && file.thumbnailUrl ? (
                  <img src={file.thumbnailUrl} alt={file.name} />
                ) : (
                  <div className="file-item-icon">
                    {getFileIcon(file.type)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="file-item-info">
                <div className="file-item-name" title={file.name}>
                  {file.name}
                </div>
                <div className="file-item-meta">
                  <span>{formatSize(file.size)}</span>
                  <span>•</span>
                  <span>{formatDate(file.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="file-item-actions">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-action-btn"
                  title="Öffnen"
                >
                  👁️
                </a>
                <a
                  href={file.url}
                  download={file.name}
                  className="file-action-btn"
                  title="Download"
                >
                  ⬇️
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Future: Cloud Integration Badge */}
      <div className="file-browser-footer">
        <span className="file-browser-badge">
          ☁️ Cloud Integration <span className="badge-soon">Bald verfügbar</span>
        </span>
      </div>
    </div>
  );
}
