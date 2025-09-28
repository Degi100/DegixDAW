import React from 'react';
import Button from '../ui/Button';
import type { DeleteAccountModalProps } from './types/settings';

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ show, onClose, onDelete, isUpdating }) => {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">⚠️ Konto löschen</h3>
        </div>
        <div className="modal-content">
          <p>
            <strong>Warnung:</strong> Diese Aktion kann nicht rückgängig gemacht werden.
            Alle Ihre Daten, Projekte und Einstellungen werden permanent gelöscht.
          </p>
          <p>Sind Sie sich absolut sicher?</p>
        </div>
        <div className="modal-actions">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isUpdating}
          >
            Abbrechen
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            className="delete-btn"
            disabled={isUpdating}
          >
            🗑️ Konto löschen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
