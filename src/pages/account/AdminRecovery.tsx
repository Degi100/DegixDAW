// ============================================
// ADMIN RECOVERY PAGE
// Admin management of account recovery requests
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Container from '../../components/layout/Container';
import { LoadingOverlay } from '../../components/ui/Loading';

// Import modular components
import RecoveryRequestCard from './components/RecoveryRequestCard';
import RecoveryInfoBox from './components/RecoveryInfoBox';

// Import types
import type { RecoveryRequest, RecoveryRequestStatus } from './types/admin-recovery.types';

export default function AdminRecovery() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<RecoveryRequest[]>([]);

  // ============================================
  // EFFECTS
  // ============================================

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

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleStatusChange = async (requestId: string, newStatus: RecoveryRequestStatus) => {
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

  // ============================================
  // RENDER
  // ============================================

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
                  <RecoveryRequestCard
                    key={request.id}
                    request={request}
                    onStatusChange={handleStatusChange}
                    onSendRecoveryEmail={sendRecoveryEmail}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <RecoveryInfoBox />
      </div>
    </Container>
  );
}
