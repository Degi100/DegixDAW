// ============================================
// PEAK METER COMPONENT
// Professional DAW-style audio level meter with clipping detection
// ============================================

import { usePeakMeter } from '../../hooks/usePeakMeter';

interface PeakMeterProps {
  audioElement: HTMLAudioElement | null;
  mode?: 'stereo' | 'mono';
  size?: 'compact' | 'full';
  showNumeric?: boolean;
  showClipIndicator?: boolean;
  showScale?: boolean;
  clipThreshold?: number;
  className?: string;
}

/**
 * Visual peak meter for audio level monitoring
 *
 * Features:
 * - Real-time peak detection with Web Audio API
 * - Stereo (L/R) or Mono display
 * - Color-coded gradient (Green → Yellow → Orange → Red)
 * - Clipping detection and warning
 * - dBFS numeric display
 * - Peak hold indicators
 *
 * @example
 * <PeakMeter
 *   audioElement={audioRef.current}
 *   mode="stereo"
 *   size="full"
 *   showNumeric={true}
 *   showClipIndicator={true}
 * />
 */
export default function PeakMeter({
  audioElement,
  mode = 'stereo',
  size = 'full',
  showNumeric = true,
  showClipIndicator = true,
  showScale = true,
  clipThreshold = 0.99,
  className = '',
}: PeakMeterProps) {
  const { peakL, peakR, peakLdB, peakRdB, peakHoldL, peakHoldR, isClipping } = usePeakMeter(
    audioElement,
    { clipThreshold }
  );

  // Convert linear (0-1) to percentage (0-100) for bar width
  const peakLPercent = Math.min(peakL * 100, 100);
  const peakRPercent = Math.min(peakR * 100, 100);
  const peakHoldLPercent = Math.min(peakHoldL * 100, 100);
  const peakHoldRPercent = Math.min(peakHoldR * 100, 100);

  // Format dB value for display
  const formatDB = (db: number): string => {
    if (db === -Infinity || db < -60) return '-∞';
    return db.toFixed(1);
  };

  // Get color based on dB level
  const getPeakColor = (db: number): string => {
    if (db >= 0) return 'var(--error-color)';      // Red: Clipping
    if (db >= -3) return '#DC2626';                 // Red: Danger
    if (db >= -6) return '#F59E0B';                 // Orange: Watch out
    if (db >= -18) return '#EAB308';                // Yellow: Getting loud
    return '#059669';                                // Green: Safe
  };

  return (
    <div className={`peak-meter peak-meter--${mode} peak-meter--${size} ${className}`}>
      {/* Left Channel (or Mono) */}
      <div className="peak-meter-channel">
        {mode === 'stereo' && <span className="channel-label">L</span>}

        <div className="peak-meter-bar">
          <div
            className="peak-meter-fill"
            style={{ width: `${peakLPercent}%` }}
          />
          {peakHoldLPercent > 0 && (
            <div
              className="peak-hold-indicator"
              style={{
                left: `${peakHoldLPercent}%`,
                backgroundColor: getPeakColor(peakLdB)
              }}
            />
          )}
        </div>

        {showNumeric && (
          <div className="peak-numeric">
            <span className="peak-value" style={{ color: getPeakColor(peakLdB) }}>
              {formatDB(peakLdB)}
            </span>
            <span className="peak-unit">dB</span>
          </div>
        )}
      </div>

      {/* Right Channel (only in stereo mode) */}
      {mode === 'stereo' && (
        <div className="peak-meter-channel">
          <span className="channel-label">R</span>

          <div className="peak-meter-bar">
            <div
              className="peak-meter-fill"
              style={{ width: `${peakRPercent}%` }}
            />
            {peakHoldRPercent > 0 && (
              <div
                className="peak-hold-indicator"
                style={{
                  left: `${peakHoldRPercent}%`,
                  backgroundColor: getPeakColor(peakRdB)
                }}
              />
            )}
          </div>

          {showNumeric && (
            <div className="peak-numeric">
              <span className="peak-value" style={{ color: getPeakColor(peakRdB) }}>
                {formatDB(peakRdB)}
              </span>
              <span className="peak-unit">dB</span>
            </div>
          )}
        </div>
      )}

      {/* Clip Indicator */}
      {showClipIndicator && isClipping && (
        <div className="clip-indicator clip-indicator--active">
          🔴 CLIPPING!
        </div>
      )}

      {/* Scale (only in full mode) */}
      {size === 'full' && showScale && (
        <div className="peak-meter-scale">
          <span>-∞</span>
          <span>-18</span>
          <span>-12</span>
          <span>-6</span>
          <span>-3</span>
          <span>-1</span>
          <span className="zero-db">0</span>
        </div>
      )}
    </div>
  );
}
