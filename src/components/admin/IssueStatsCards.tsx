// src/components/admin/IssueStatsCards.tsx
// Stats cards for Issue Management

interface IssueStatsCardsProps {
  stats: {
    open: number;
    inProgress: number;
    done: number;
    urgentCount: number;
  };
}

export default function IssueStatsCards({ stats }: IssueStatsCardsProps) {
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
          <div className="issue-stats__value">{stats.inProgress}</div>
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
      {stats.urgentCount > 0 && (
        <div className="issue-stats__card issue-stats__card--urgent">
          <div className="issue-stats__icon">🚨</div>
          <div className="issue-stats__content">
            <div className="issue-stats__value">{stats.urgentCount}</div>
            <div className="issue-stats__label">Urgent</div>
          </div>
        </div>
      )}
    </div>
  );
}
