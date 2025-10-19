// ============================================
// COMMENT MARKERS COMPONENT
// Visual markers on waveform for timestamp comments
// ============================================

import type { TrackComment } from '../../types/tracks';

interface CommentMarkersProps {
  comments: TrackComment[];
  duration: number; // in seconds
  width: number; // canvas width
  height: number; // canvas height
  onMarkerClick: (comment: TrackComment) => void;
}

export default function CommentMarkers({
  comments,
  duration,
  width,
  height: _height,
  onMarkerClick,
}: CommentMarkersProps) {
  if (!duration || !width) return null;

  return (
    <div className="comment-markers">
      {comments.map((comment) => {
        const timestampSec = comment.timestamp_ms / 1000;
        const positionPercent = (timestampSec / duration) * 100;

        return (
          <button
            key={comment.id}
            className={`comment-marker ${comment.is_resolved ? 'resolved' : 'active'}`}
            style={{
              left: `${positionPercent}%`,
            }}
            onClick={() => onMarkerClick(comment)}
            title={`${formatTimestamp(comment.timestamp_ms)} - ${comment.content.substring(0, 50)}...`}
          >
            <div className="marker-icon">
              {comment.is_resolved ? '✓' : '💬'}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
