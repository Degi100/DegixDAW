/**
 * MilestonesList Component
 *
 * Displays recent project milestones in timeline format
 * Supports custom milestones from database + hardcoded system milestones
 */

import { useState, useEffect } from 'react';
import { getAllMilestones, deleteMilestone } from '../../../lib/services/analytics/milestonesService';
import { getCommitUrl } from '../../../lib/constants/projectConfig';
import type { Milestone } from '../../../lib/services/analytics/types';
import { useAuth } from '../../../hooks/useAuth';
import './MilestonesList.scss';

interface MilestonesListProps {
  limit?: number;
  onAddClick?: () => void;
}

export function MilestonesList({ limit = 12, onAddClick }: MilestonesListProps) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<Array<Milestone & { isCustom: boolean; createdBy?: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMilestones = async () => {
    try {
      const data = await getAllMilestones();
      setMilestones(limit ? data.slice(0, limit) : data);
    } catch (error) {
      console.error('[MilestonesList] Failed to load milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMilestones();
  }, [limit]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this milestone? This action cannot be undone.')) return;

    try {
      setDeletingId(id);
      await deleteMilestone(id);
      await loadMilestones(); // Reload after delete
    } catch (error) {
      console.error('[MilestonesList] Failed to delete milestone:', error);
      alert('Failed to delete milestone. You can only delete milestones you created.');
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (milestone: Milestone & { isCustom: boolean; createdBy?: string | null }) => {
    return milestone.isCustom && milestone.createdBy === user?.id;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="milestones-list">
        <div className="milestones-list__header">
          <h2>🎯 Major Milestones</h2>
        </div>
        <div className="milestones-list__loading">
          <div className="spinner-small" />
          <p>Loading milestones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="milestones-list">
      <div className="milestones-list__header">
        <h2>🎯 Major Milestones</h2>
        {onAddClick && (
          <button onClick={onAddClick} className="btn btn--small btn--primary" title="Add Milestone">
            ➕ Add
          </button>
        )}
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

                {/* Badge: System vs Custom */}
                {milestone.isCustom ? (
                  <span className="milestone-item__badge milestone-item__badge--custom" title="Custom milestone">
                    Custom
                  </span>
                ) : (
                  <span className="milestone-item__badge milestone-item__badge--system" title="System milestone">
                    System
                  </span>
                )}
              </div>

              {milestone.description && (
                <p className="milestone-item__description">{milestone.description}</p>
              )}

              <div className="milestone-item__footer">
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

                {/* Delete Button (only for own custom milestones) */}
                {canDelete(milestone) && (
                  <button
                    onClick={() => handleDelete(milestone.id)}
                    className="milestone-item__delete"
                    disabled={deletingId === milestone.id}
                    title="Delete milestone"
                  >
                    {deletingId === milestone.id ? '⏳' : '🗑️'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {milestones.length === 0 && (
          <div className="milestones-list__empty">
            <p>No milestones yet. Add your first milestone!</p>
          </div>
        )}
      </div>
    </div>
  );
}
