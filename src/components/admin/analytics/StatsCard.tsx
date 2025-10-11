/**
 * StatsCard Component
 *
 * Single KPI card for Analytics Dashboard
 * Shows: Icon, Label, Value, optional Trend
 */

import './StatsCard.scss';

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  trend?: {
    value: number;      // Percentage
    isPositive: boolean;
  };
  subtitle?: string;
  details?: string[];   // Array of detail lines
}

export function StatsCard({ icon, label, value, trend, subtitle, details }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="stats-card__header">
        <span className="stats-card__icon">{icon}</span>
        <span className="stats-card__label">{label}</span>
      </div>

      <div className="stats-card__value">{value}</div>

      {subtitle && (
        <div className="stats-card__subtitle">{subtitle}</div>
      )}

      {details && details.length > 0 && (
        <div className="stats-card__details">
          {details.map((detail, idx) => (
            <div key={idx} className="stats-card__detail-item">
              {detail}
            </div>
          ))}
        </div>
      )}

      {trend && (
        <div className={`stats-card__trend ${trend.isPositive ? 'positive' : 'negative'}`}>
          <span className="stats-card__trend-arrow">
            {trend.isPositive ? '↗' : '↘'}
          </span>
          <span className="stats-card__trend-value">
            {Math.abs(trend.value)}%
          </span>
        </div>
      )}
    </div>
  );
}
