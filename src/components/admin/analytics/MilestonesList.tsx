/**
 * MilestonesList Component
 *
 * Displays recent project milestones in timeline format
 */

import { getRecentMilestones } from '../../../lib/constants/milestones';
import { getCommitUrl } from '../../../lib/constants/projectConfig';
import './MilestonesList.scss';

interface MilestonesListProps {
  limit?: number;
}

export function MilestonesList({ limit = 8 }: MilestonesListProps) {
  const milestones = getRecentMilestones(limit);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <div className="milestones-list">
      <div className="milestones-list__header">
        <h2>🎯 Major Milestones</h2>
      </div>

      <div className="milestones-list__items">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="milestone-item">
            <div className="milestone-item__dot" />

            <div className="milestone-item__content">
              <div className="milestone-item__header">
                <span className="milestone-item__icon">{milestone.icon}</span>
                <span className="milestone-item__title">{milestone.title}</span>
                <span className="milestone-item__date">{formatDate(milestone.date)}</span>
              </div>

              {milestone.description && (
                <p className="milestone-item__description">{milestone.description}</p>
              )}

              {milestone.commit_hash && (
                <a
                  href={getCommitUrl(milestone.commit_hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="milestone-item__commit"
                  title="View commit on GitHub"
                >
                  {milestone.commit_hash.substring(0, 7)}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
