// src/pages/AdminRecovery.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Container from '../../components/layout/Container';
import { LoadingOverlay } from '../../components/ui/Loading';

interface RecoveryRequest {
  id: string;
  name: string;
  alternateEmail?: string;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  createdAt: string;
}

export default function AdminRecovery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<RecoveryRequest[]>([]);

  useEffect(() => {
    // Check if user has admin privileges (simplified check)
    if (!user) {
      navigate('/login');
      return;
    }

    // In a real app, you'd check if user is admin
    // For demo purposes, we'll allow access if user is logged in
    
    const loadRecoveryRequests = async () => {
      try {
        // Simulate loading recovery requests from API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        const mockRequests: RecoveryRequest[] = [
          {
            id: '1',
            name: 'Max Mustermann',
            alternateEmail: 'max.alt@gmail.com',
            description: 'Ich habe mein Passwort und meine E-Mail vergessen. Registriert etwa im Mai 2024. Hatte Projekte zu React und TypeScript.',
            status: 'pending',
            createdAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2', 
            name: 'Anna Schmidt',
            description: 'Kann mich nicht mehr an meine E-Mail erinnern. Hatte Discord OAuth verwendet. Account seit Juni 2024.',
            status: 'in-progress',
            createdAt: '2024-01-14T15:45:00Z'
          }
        ];
        
        setRequests(mockRequests);
      } catch {
        error('❌ Fehler beim Laden der Recovery-Anfragen');
      } finally {
        setIsLoading(false);
      }
    };

    loadRecoveryRequests();
  }, [user, navigate, error]);

  const handleStatusChange = async (requestId: string, newStatus: RecoveryRequest['status']) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setRequests(prev => prev.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
      
      success(`✅ Status auf "${newStatus}" geändert`);
    } catch {
      error('❌ Fehler beim Ändern des Status');
    }
  };

  const sendRecoveryEmail = async (requestId: string) => {
    try {
      // Simulate sending recovery email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      success('📧 Recovery-E-Mail wurde gesendet!');
      await handleStatusChange(requestId, 'resolved');
    } catch {
      error('❌ Fehler beim Senden der Recovery-E-Mail');
    }
  };

  const getStatusColor = (status: RecoveryRequest['status']) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'in-progress': return 'blue';
      case 'resolved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: RecoveryRequest['status']) => {
    switch (status) {
      case 'pending': return 'Wartend';
      case 'in-progress': return 'In Bearbeitung';
      case 'resolved': return 'Gelöst';
      case 'rejected': return 'Abgelehnt';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingOverlay message="Lade Recovery-Anfragen..." />
      </Container>
    );
  }

  return (
    <Container>
      <div className="page">
        <div className="card card-large">
          <div className="card-header">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="small"
            >
              ← Zurück zum Dashboard
            </Button>
            <h1>🛠️ Account Recovery Verwaltung</h1>
            <p>Verwaltung von Account-Wiederherstellungsanfragen</p>
          </div>

          <div className="admin-content">
            {requests.length === 0 ? (
              <div className="empty-state">
                <p>📭 Keine Recovery-Anfragen vorhanden</p>
              </div>
            ) : (
              <div className="recovery-requests">
                {requests.map(request => (
                  <div key={request.id} className="recovery-request-card">
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
                            onClick={() => handleStatusChange(request.id, 'in-progress')}
                            variant="primary"
                            size="small"
                          >
                            In Bearbeitung
                          </Button>
                          <Button
                            onClick={() => sendRecoveryEmail(request.id)}
                            variant="success"
                            size="small"
                          >
                            Recovery-E-Mail senden
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(request.id, 'rejected')}
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
                            onClick={() => sendRecoveryEmail(request.id)}
                            variant="success"
                            size="small"
                          >
                            Recovery-E-Mail senden
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(request.id, 'rejected')}
                            variant="error"
                            size="small"
                          >
                            Ablehnen
                          </Button>
                        </>
                      )}

                      {(request.status === 'resolved' || request.status === 'rejected') && (
                        <Button
                          onClick={() => handleStatusChange(request.id, 'pending')}
                          variant="outline"
                          size="small"
                        >
                          Wieder öffnen
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="admin-info">
          <div className="info-box">
            <h3>💡 Recovery-Prozess</h3>
            <ol>
              <li>Nutzer stellt Anfrage über "/auth/recovery"</li>
              <li>Admin prüft die Anfrage und Identität</li>
              <li>Bei Erfolg: Recovery-Link per E-Mail senden</li>
              <li>Nutzer kann über Link Passwort zurücksetzen</li>
            </ol>
          </div>
        </div>
      </div>
      
    </Container>
  );
}