// ============================================
// WAVEFORM CANVAS COMPONENT
// Canvas-based waveform visualization with playback position
// ============================================

import { useEffect, useRef, useState, useCallback } from 'react';
import type { WaveformData } from '../../types/tracks';

interface WaveformCanvasProps {
  waveformData: WaveformData;
  currentTime?: number; // in seconds
  duration?: number; // in seconds
  onSeek?: (time: number) => void;
  className?: string;
  height?: number;
  color?: string;
  progressColor?: string;
}

export default function WaveformCanvas({
  waveformData,
  currentTime = 0,
  duration = 0,
  onSeek,
  className = '',
  height = 120,
  color = '#4a90e2',
  progressColor = '#357abd',
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const [hovering, setHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  // ============================================
  // Resize Observer
  // ============================================

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // ============================================
  // Draw Waveform
  // ============================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.peaks.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (2x for retina)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const peaks = waveformData.peaks;
    const barWidth = width / peaks.length;
    const centerY = height / 2;
    const maxAmplitude = height / 2 - 4; // Leave 4px padding

    // Calculate playback position
    const playbackPosition = duration > 0 ? (currentTime / duration) * width : 0;

    // Draw waveform bars
    for (let i = 0; i < peaks.length; i++) {
      const x = i * barWidth;
      const peak = peaks[i];
      const barHeight = peak * maxAmplitude;

      // Choose color based on playback position
      ctx.fillStyle = x < playbackPosition ? progressColor : color;

      // Draw bar (centered vertically)
      ctx.fillRect(
        x,
        centerY - barHeight,
        Math.max(1, barWidth - 1), // Min 1px width
        barHeight * 2
      );
    }

    // Draw playback position marker
    if (currentTime > 0 && duration > 0) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playbackPosition, 0);
      ctx.lineTo(playbackPosition, height);
      ctx.stroke();
    }

    // Draw hover marker
    if (hovering && hoverTime !== null) {
      const hoverX = (hoverTime / duration) * width;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [waveformData, width, height, currentTime, duration, color, progressColor, hovering, hoverTime]);

  // ============================================
  // Mouse Handlers
  // ============================================

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!duration || !onSeek) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / width) * duration;

      setHoverTime(Math.max(0, Math.min(duration, time)));
    },
    [width, duration, onSeek]
  );

  const handleMouseEnter = useCallback(() => {
    if (onSeek) setHovering(true);
  }, [onSeek]);

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
    setHoverTime(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!duration || !onSeek) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = (x / width) * duration;

      onSeek(Math.max(0, Math.min(duration, time)));
    },
    [width, duration, onSeek]
  );

  // ============================================
  // Render
  // ============================================

  return (
    <div
      ref={containerRef}
      className={`waveform-canvas ${className} ${onSeek ? 'interactive' : ''}`}
      style={{ width: '100%', height: `${height}px`, position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: onSeek ? 'pointer' : 'default',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      {/* Hover Time Tooltip */}
      {hovering && hoverTime !== null && (
        <div
          className="waveform-tooltip"
          style={{
            position: 'absolute',
            top: '-30px',
            left: `${(hoverTime / duration) * 100}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {formatTime(hoverTime)}
        </div>
      )}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
