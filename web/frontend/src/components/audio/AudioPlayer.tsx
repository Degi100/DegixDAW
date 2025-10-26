// ============================================
// AUDIO PLAYER COMPONENT
// Full-featured audio player with waveform visualization
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react';
import WaveformCanvas from './WaveformCanvas';
import CommentMarkers from './CommentMarkers';
import CommentsList from './CommentsList';
import AddCommentModal from './AddCommentModal';
import Button from '../ui/Button';
import { useTrackComments } from '../../hooks/useTrackComments';
import { supabase } from '../../lib/supabase';
import { useSyncPlayback } from '../../hooks/useSyncPlayback';
import type { Track } from '../../types/tracks';

interface AudioPlayerProps {
  track: Track;
  autoPlay?: boolean;
  className?: string;
}

export default function AudioPlayer({
  track,
  autoPlay = false,
  className = '',
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [pan, setPan] = useState(track.pan); // -1.0 (L) to 1.0 (R)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Comments hook
  const {
    comments,
    create: createComment,
    update: updateComment,
    remove: deleteComment,
    toggleResolved,
    unresolvedCount,
  } = useTrackComments(track.id);

  // Sync playback hook
  const {
    syncState,
    toggleSync,
    joinAsListener,
    broadcastPlay,
    broadcastPause,
    broadcastSeek,
  } = useSyncPlayback({
    trackId: track.id,
    currentUserId,
    currentUsername,
    onPlay: (timestamp) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = timestamp / 1000;
      audio.play();
    },
    onPause: (timestamp) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = timestamp / 1000;
      audio.pause();
    },
    onSeek: (timestamp) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = timestamp / 1000;
    },
  });

  // ============================================
  // Get Current User
  // ============================================

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id || null;
      setCurrentUserId(userId);
      
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();
        
        setCurrentUsername(profile?.username || null);
      }
    });
  }, []);

  // ============================================
  // Audio URL (from track.file_url or fetch signed URL)
  // ============================================

  const audioUrl = track.file_url;

  // Debug log
  useEffect(() => {
    console.log('🎵 AudioPlayer track:', {
      id: track.id,
      name: track.name,
      file_path: track.file_path,
      file_url: track.file_url,
      has_waveform: !!track.waveform_data
    });
  }, [track]);

  // ============================================
  // Audio Element Handlers
  // ============================================

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError('Failed to load audio file');
      setLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  // ============================================
  // Autoplay
  // ============================================

  useEffect(() => {
    if (autoPlay && audioRef.current && !loading) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked by browser
      });
    }
  }, [autoPlay, loading]);

  // ============================================
  // Playback Controls
  // ============================================

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      // Broadcast pause if in host mode
      if (syncState.mode === 'host') {
        broadcastPause(audio.currentTime * 1000);
      }
    } else {
      audio.play().catch((err) => {
        setError('Playback failed: ' + err.message);
      });
      // Broadcast play if in host mode
      if (syncState.mode === 'host') {
        broadcastPlay(audio.currentTime * 1000);
      }
    }
  }, [isPlaying, syncState.mode, broadcastPlay, broadcastPause]);

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
    
    // Broadcast seek if in host mode
    if (syncState.mode === 'host') {
      broadcastSeek(time * 1000);
    }
  }, [syncState.mode, broadcastSeek]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const vol = Math.max(0, Math.min(1, newVolume));
    audio.volume = vol;
    setVolume(vol);
  }, []);

  const handlePanChange = useCallback((newPan: number) => {
    const p = Math.max(-1, Math.min(1, newPan));
    setPan(p);
    // Note: HTML5 audio doesn't support pan directly
    // Pan will be saved to DB but not applied in playback (would need Web Audio API)
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
  }, [currentTime, duration]);

  // ============================================
  // Comment Handlers
  // ============================================

  const handleAddComment = useCallback(() => {
    // Pause playback to freeze timestamp
    if (isPlaying) {
      togglePlayPause();
    }
    setShowAddComment(true);
  }, [isPlaying, togglePlayPause]);

  const handleSubmitComment = useCallback(async (content: string) => {
    const timestampMs = Math.round(currentTime * 1000);
    await createComment({ timestamp_ms: timestampMs, content });
    setShowAddComment(false);

    // Resume playback after adding comment
    if (!isPlaying && audioRef.current) {
      togglePlayPause();
    }
  }, [currentTime, createComment, isPlaying, togglePlayPause]);

  const handleCommentClick = useCallback((comment: any) => {
    // Jump to comment timestamp
    handleSeek(comment.timestamp_ms / 1000);
  }, [handleSeek]);

  const handleEditComment = useCallback(async (commentId: string, newContent: string) => {
    await updateComment(commentId, { content: newContent });
  }, [updateComment]);

  // ============================================
  // Format Helpers
  // ============================================

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // Render
  // ============================================

  if (!audioUrl) {
    return (
      <div className={`audio-player ${className}`}>
        <div className="audio-player-error">
          <p>No audio file available</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`audio-player ${className}`}>
        <div className="audio-player-error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`audio-player ${className} ${loading ? 'loading' : ''}`}>
      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Track Info */}
      <div className="audio-player-header">
        <div className="track-info">
          <h3 className="track-name">{track.name}</h3>
          <p className="track-meta">
            {track.track_type.toUpperCase()}
            {track.duration_ms && ` • ${formatTime(track.duration_ms / 1000)}`}
            {track.sample_rate && ` • ${(track.sample_rate / 1000).toFixed(1)}kHz`}
            {track.bpm && ` • ${track.bpm} BPM`}
          </p>
        </div>

        {/* Sync State Indicator */}
        {syncState.mode !== 'off' && (
          <div className="sync-state-indicator">
            {syncState.mode === 'host' && (
              <span className="sync-badge sync-host">🎛️ Hosting sync session</span>
            )}
            {syncState.mode === 'listener' && syncState.hostUsername && (
              <span className="sync-badge sync-listener">
                👂 Listening to {syncState.hostUsername}
              </span>
            )}
            {syncState.mode === 'listener' && !syncState.hostUsername && (
              <span className="sync-badge sync-listener">👂 Synced</span>
            )}
          </div>
            {syncState.mode === 'off' && syncState.hostUserId && (
              <button className="sync-join-btn" onClick={joinAsListener}>
                🔗 Join {syncState.hostUsername}'s sync session
              </button>
            )}
        )}
      </div>

      {/* Waveform with Comment Markers */}
      {track.waveform_data && (
        <div className="audio-player-waveform-container">
          <div className="audio-player-waveform">
            <WaveformCanvas
              waveformData={track.waveform_data}
              currentTime={currentTime}
              duration={duration || (track.duration_ms ? track.duration_ms / 1000 : 0)}
              onSeek={handleSeek}
              color={track.color || '#4a90e2'}
              progressColor={track.color ? adjustBrightness(track.color, -20) : '#357abd'}
            />
            <CommentMarkers
              comments={comments}
              duration={duration || (track.duration_ms ? track.duration_ms / 1000 : 0)}
              width={800}
              height={120}
              onMarkerClick={handleCommentClick}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="audio-player-controls">
        {/* Time Display */}
        <div className="time-display">
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="separator">/</span>
          <span className="total-time">
            {formatTime(duration || (track.duration_ms ? track.duration_ms / 1000 : 0))}
          </span>
        </div>

        {/* Transport Controls */}
        <div className="transport-controls">
          <Button
            variant="secondary"
            size="small"
            onClick={() => handleSkip(-10)}
            disabled={loading}
            title="Skip back 10s"
          >
            ⏮️
          </Button>

          <Button
            variant="primary"
            size="large"
            onClick={togglePlayPause}
            disabled={loading}
            className="play-pause-btn"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </Button>

          <Button
            variant="secondary"
            size="small"
            onClick={() => handleSkip(10)}
            disabled={loading}
            title="Skip forward 10s"
          >
            ⏭️
          </Button>
            <Button
            variant={syncState.mode === 'off' ? 'secondary' : syncState.mode === 'host' ? 'primary' : 'success'}
            size="small"
            onClick={toggleSync}
            disabled={loading || !currentUserId}
            title={syncState.mode === 'off' ? 'Enable sync playback' : syncState.mode === 'host' ? 'You are hosting' : 'Synced with host'}
            className="sync-btn"
          >
            {syncState.mode === 'off' && '🔗'}
            {syncState.mode === 'host' && '🎛️'}
            {syncState.mode === 'listener' && '👂'}
          </Button>
        </div>

        {/* Volume Control */}
        <div className="volume-control">
          <button
            className="volume-icon"
            onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
            title={volume > 0 ? 'Mute' : 'Unmute'}
          >
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="volume-slider"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
          <span className="volume-percentage">{Math.round(volume * 100)}%</span>
        </div>

        {/* Pan Control */}
        <div className="pan-control">
          <span className="pan-label">Pan:</span>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={pan}
            onChange={(e) => handlePanChange(parseFloat(e.target.value))}
            className="pan-slider"
            title={`Pan: ${pan === 0 ? 'Center' : pan < 0 ? `${Math.abs(pan * 100).toFixed(0)}% L` : `${(pan * 100).toFixed(0)}% R`}`}
          />
          <span className="pan-value">
            {pan === 0 ? 'C' : pan < 0 ? `${Math.abs(pan * 100).toFixed(0)}L` : `${(pan * 100).toFixed(0)}R`}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="audio-player-comments-section">
        <div className="comments-header">
          <button
            className="comments-toggle"
            onClick={() => setShowComments(!showComments)}
          >
            💬 Comments ({comments.length})
            {unresolvedCount > 0 && (
              <span className="unresolved-badge">{unresolvedCount} unresolved</span>
            )}
          </button>
          <Button variant="secondary" onClick={handleAddComment}>
            ➕ Add Comment at {formatTime(currentTime)}
          </Button>
        </div>

        {showComments && (
          <CommentsList
            comments={comments}
            onCommentClick={handleCommentClick}
            onToggleResolved={toggleResolved}
            onDelete={deleteComment}
            onEdit={handleEditComment}
            currentUserId={currentUserId || undefined}
          />
        )}
      </div>

      {/* Add Comment Modal */}
      {showAddComment && (
        <AddCommentModal
          timestampMs={Math.round(currentTime * 1000)}
          onSubmit={handleSubmitComment}
          onCancel={() => setShowAddComment(false)}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="audio-player-loading">
          <div className="spinner"></div>
          <p>Loading audio...</p>
        </div>
      )}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function adjustBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust
  const adjust = (val: number) => Math.max(0, Math.min(255, val + (val * percent) / 100));

  const newR = adjust(r).toString(16).padStart(2, '0');
  const newG = adjust(g).toString(16).padStart(2, '0');
  const newB = adjust(b).toString(16).padStart(2, '0');

  return `#${newR}${newG}${newB}`;
}
