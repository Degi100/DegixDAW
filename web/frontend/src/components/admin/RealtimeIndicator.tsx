// src/components/admin/RealtimeIndicator.tsx
interface RealtimeIndicatorProps {
  isEnabled: boolean;
  lastUpdated: Date;
  onToggle: () => void;
}

export default function RealtimeIndicator({
  isEnabled,
  lastUpdated,
  onToggle
}: RealtimeIndicatorProps) {
  return (
    <div className="realtime-indicator">
      <span className={`status-dot ${isEnabled ? 'active' : 'inactive'}`}></span>
      <span>Real-time: {isEnabled ? 'ON' : 'OFF'}</span>
      <button
        onClick={onToggle}
        className="realtime-toggle"
      >
        {isEnabled ? 'Disable' : 'Enable'}
      </button>
      <span className="last-updated">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </span>
    </div>
  );
}