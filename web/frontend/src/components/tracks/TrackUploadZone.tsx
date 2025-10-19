// ============================================
// TRACK UPLOAD ZONE
// Drag & Drop area for audio file uploads
// ============================================

import { useState, useCallback, useRef } from 'react';
import { validateAudioFile, formatFileSize } from '../../lib/audio/audioMetadata';
import Button from '../ui/Button';

interface TrackUploadZoneProps {
  projectId: string;
  onUploadStart?: (file: File) => void;
  onUploadComplete?: (trackId: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
}

export default function TrackUploadZone({
  projectId,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  disabled = false,
}: TrackUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // Drag & Drop Handlers
  // ============================================

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [disabled]);

  // ============================================
  // File Selection
  // ============================================

  const handleFileSelection = useCallback((file: File) => {
    // Validate file
    const validation = validateAudioFile(file);

    if (!validation.valid) {
      onUploadError?.(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    onUploadStart?.(file);
  }, [onUploadStart, onUploadError]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // ============================================
  // Render
  // ============================================

  return (
    <div className={`track-upload-zone ${disabled ? 'disabled' : ''}`}>
      {/* Drag & Drop Area */}
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          // File Selected
          <div className="file-preview">
            <div className="file-icon">🎵</div>
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              className="clear-button"
              onClick={handleClearSelection}
              type="button"
            >
              ✕
            </button>
          </div>
        ) : (
          // Empty State
          <div className="upload-prompt">
            <div className="upload-icon">📤</div>
            <h3>Drop Audio Files Here</h3>
            <p className="upload-description">
              Or click to browse your files
            </p>
            <p className="upload-formats">
              Supported: MP3, WAV, FLAC, M4A, AAC, OGG, WebM
            </p>
            <p className="upload-limit">
              Maximum file size: 500 MB
            </p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.webm"
          onChange={handleFileInputChange}
          disabled={disabled}
          style={{ display: 'none' }}
        />
      </div>

      {/* Actions */}
      <div className="upload-actions">
        {selectedFile ? (
          <>
            <Button
              variant="secondary"
              onClick={handleClearSelection}
              disabled={disabled}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              onClick={() => onUploadComplete?.(selectedFile.name)}
              disabled={disabled}
            >
              Upload Track
            </Button>
          </>
        ) : (
          <Button
            variant="secondary"
            onClick={handleBrowseClick}
            disabled={disabled}
            icon="📁"
          >
            Browse Files
          </Button>
        )}
      </div>
    </div>
  );
}
