// src/components/ui/EmailChangeInfo.tsx
import { useState } from 'react';

interface EmailChangeInfoProps {
  oldEmail: string;
  newEmail: string;
  onClose?: () => void;
}

export default function EmailChangeInfo({ oldEmail, newEmail, onClose }: EmailChangeInfoProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-2">📧</span>
            <h3 className="text-lg font-bold text-gray-900">
              Email-Änderung gestartet
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-gray-600">
            Sie erhalten <strong>2 Bestätigungs-E-Mails</strong>:
          </p>

          <div className="space-y-3">
            {/* Old Email */}
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <span className="text-yellow-600 mr-2 mt-0.5">🔒</span>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  An Ihre aktuelle Email
                </p>
                <p className="text-sm text-yellow-700">
                  {oldEmail}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Sicherheitsbenachrichtigung
                </p>
              </div>
            </div>

            {/* New Email */}
            <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-600 mr-2 mt-0.5">✅</span>
              <div>
                <p className="text-sm font-medium text-green-800">
                  An Ihre neue Email
                </p>
                <p className="text-sm text-green-700">
                  {newEmail}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  <strong>Hier klicken um zu bestätigen!</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Wichtig:</strong> Klicken Sie den Link in der E-Mail an 
              <strong className="text-blue-900"> {newEmail}</strong>, 
              um die Änderung abzuschließen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
}