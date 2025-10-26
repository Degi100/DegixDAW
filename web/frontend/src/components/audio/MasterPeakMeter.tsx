// ============================================
// MASTER PEAK METER COMPONENT
// Project-wide master bus monitoring (compact version)
// ============================================

import { useMasterPeakMeter } from '../../hooks/useMasterPeakMeter';

interface MasterPeakMeterProps {
  audioElements: (HTMLAudioElement | null)[];
  clipThreshold?: number;
  className?: string;
}

/**
 * Compact master peak meter for project-wide monitoring
 *
 * Displays:
 * - Single bar (summed from all active tracks)
 * - Numeric dBFS value
 * - Clip indicator
 * - Active track count
 *
 * @example
 * <MasterPeakMeter audioElements={[audioRef1.current, audioRef2.current]} />
 */
export default function MasterPeakMeter({
  audioElements,
  clipThreshold = 0.99,
  className = '',
}: MasterPeakMeterProps) {
  const { peak, peakdB, peakHold, isClipping, activeTrackCount } = useMasterPeakMeter(
    audioElements,
    { clipThreshold }
  );

  // Convert linear (0-1) to percentage (0-100)
  const peakPercent = Math.min(peak * 100, 100);
  const peakHoldPercent = Math.min(peakHold * 100, 100);

  // Format dB value
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
    <div className={`master-peak-meter ${className}`}>
      <div className="master-peak-meter-header">
        <span className="master-label">🎛️ MASTER OUT</span>
        {activeTrackCount > 0 && (
          <span className="active-tracks">
            {activeTrackCount} track{activeTrackCount !== 1 ? 's' : ''} playing
          </span>
        )}
      </div>

      <div className="master-peak-meter-body">
        <div className="master-peak-bar">
          <div
            className="master-peak-fill"
            style={{ width: `${peakPercent}%` }}
          />
          {peakHoldPercent > 0 && (
            <div
              className="master-peak-hold"
              style={{
                left: `${peakHoldPercent}%`,
                backgroundColor: getPeakColor(peakdB)
              }}
            />
          )}
        </div>

        <div className="master-peak-numeric">
          <span className="master-peak-value" style={{ color: getPeakColor(peakdB) }}>
            {formatDB(peakdB)}
          </span>
          <span className="master-peak-unit">dBFS</span>
        </div>

        {isClipping && (
          <div className="master-clip-indicator">
            🔴
          </div>
        )}
      </div>
    </div>
  );
}
