// ============================================
// RECOVERY REQUEST CARD
// Individual recovery request display
// ============================================

import Button from '../../../components/ui/Button';
import type { RecoveryRequestCardProps } from '../types/admin-recovery.types';

export default function RecoveryRequestCard({
  request,
  onStatusChange,
  onSendRecoveryEmail
}: RecoveryRequestCardProps) {
  const getStatusColor = (status: typeof request.status) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'in-progress': return 'blue';
      case 'resolved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: typeof request.status) => {
    switch (status) {
      case 'pending': return 'Wartend';
      case 'in-progress': return 'In Bearbeitung';
      case 'resolved': return 'Gelöst';
      case 'rejected': return 'Abgelehnt';
      default: return status;
    }
  };

  return (
    <div className="recovery-request-card">
      <div className="request-header">
        <div className="request-info">
          <h3>{request.name}</h3>
          <p className="request-date">
            {new Date(request.createdAt).toLocaleDateString('de-DE')}
          </p>
        </div>
        <div className={`status-badge status-${getStatusColor(request.status)}`}>
          {getStatusText(request.status)}
        </div>
      </div>

      {request.alternateEmail && (
        <div className="request-detail">
          <strong>Alternative E-Mail:</strong> {request.alternateEmail}
        </div>
      )}

      <div className="request-detail">
        <strong>Beschreibung:</strong>
        <p>{request.description}</p>
      </div>

      <div className="request-actions">
        {request.status === 'pending' && (
          <>
            <Button
              onClick={() => onStatusChange(request.id, 'in-progress')}
              variant="primary"
              size="small"
            >
              In Bearbeitung
            </Button>
            <Button
              onClick={() => onSendRecoveryEmail(request.id)}
              variant="success"
              size="small"
            >
              Recovery-E-Mail senden
            </Button>
            <Button
              onClick={() => onStatusChange(request.id, 'rejected')}
              variant="error"
              size="small"
            >
              Ablehnen
            </Button>
          </>
        )}

        {request.status === 'in-progress' && (
          <>
            <Button
              onClick={() => onSendRecoveryEmail(request.id)}
              variant="success"
              size="small"
            >
              Recovery-E-Mail senden
            </Button>
            <Button
              onClick={() => onStatusChange(request.id, 'rejected')}
              variant="error"
              size="small"
            >
              Ablehnen
            </Button>
          </>
        )}

        {(request.status === 'resolved' || request.status === 'rejected') && (
          <Button
            onClick={() => onStatusChange(request.id, 'pending')}
            variant="outline"
            size="small"
          >
            Wieder öffnen
          </Button>
        )}
      </div>
    </div>
  );
}
