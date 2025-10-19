// ============================================
// AUDIO PLAYER COMPONENT
// Full-featured audio player with waveform visualization
// ============================================

import { useState, useRef, useEffect, useCallback } from 'react';
import WaveformCanvas from './WaveformCanvas';
import Button from '../ui/Button';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // Audio URL (from track.file_url or fetch signed URL)
  // ============================================

  const audioUrl = track.file_url;

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
    } else {
      audio.play().catch((err) => {
        setError('Playback failed: ' + err.message);
      });
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const vol = Math.max(0, Math.min(1, newVolume));
    audio.volume = vol;
    setVolume(vol);
  }, []);

  const handleSkip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
  }, [currentTime, duration]);

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
          </p>
        </div>
      </div>

      {/* Waveform */}
      {track.waveform_data && (
        <div className="audio-player-waveform">
          <WaveformCanvas
            waveformData={track.waveform_data}
            currentTime={currentTime}
            duration={duration || (track.duration_ms ? track.duration_ms / 1000 : 0)}
            onSeek={handleSeek}
            color={track.color || '#4a90e2'}
            progressColor={track.color ? adjustBrightness(track.color, -20) : '#357abd'}
          />
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
      </div>

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
