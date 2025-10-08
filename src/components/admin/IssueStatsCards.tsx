// ============================================================================
// ISSUE STATS CARDS - Updated for new IssueStats type
// ============================================================================

import type { IssueStats } from '../../lib/services/issues';

interface IssueStatsCardsProps {
  stats: IssueStats;
}

export default function IssueStatsCards({ stats }: IssueStatsCardsProps) {
  const urgentCount = stats.by_priority.critical + stats.by_priority.high;

  return (
    <div className="issue-stats">
      <div className="issue-stats__card issue-stats__card--open">
        <div className="issue-stats__icon">🔵</div>
        <div className="issue-stats__content">
          <div className="issue-stats__value">{stats.open}</div>
          <div className="issue-stats__label">Open</div>
        </div>
      </div>
      <div className="issue-stats__card issue-stats__card--in-progress">
        <div className="issue-stats__icon">🟡</div>
        <div className="issue-stats__content">
          <div className="issue-stats__value">{stats.in_progress}</div>
          <div className="issue-stats__label">In Progress</div>
        </div>
      </div>
      <div className="issue-stats__card issue-stats__card--done">
        <div className="issue-stats__icon">✅</div>
        <div className="issue-stats__content">
          <div className="issue-stats__value">{stats.done}</div>
          <div className="issue-stats__label">Done</div>
        </div>
      </div>
      {urgentCount > 0 && (
        <div className="issue-stats__card issue-stats__card--urgent">
          <div className="issue-stats__icon">🚨</div>
          <div className="issue-stats__content">
            <div className="issue-stats__value">{urgentCount}</div>
            <div className="issue-stats__label">Urgent</div>
          </div>
        </div>
      )}
    </div>
  );
}
