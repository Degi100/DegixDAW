import React from 'react';
import Button from '../ui/Button';
import type { EmailChangeInfoModalProps } from './types/settings';

const EmailChangeInfoModal: React.FC<EmailChangeInfoModalProps> = ({ show, info, onClose }) => {
  if (!show || !info) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">📧 E-Mail Änderung</h3>
        </div>
        <div className="modal-content">
          <p>
            Ein Bestätigungslink wurde an <strong>{info.newEmail}</strong> gesendet.
          </p>
          <p>
            Bitte überprüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Bestätigungslink.
          </p>
        </div>
        <div className="modal-actions">
          <Button
            onClick={onClose}
            variant="primary"
          >
            Verstanden
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailChangeInfoModal;
