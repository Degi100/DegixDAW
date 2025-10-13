// ============================================
// ADMIN RECOVERY TYPES
// Shared TypeScript Interfaces for AdminRecovery
// ============================================

// Recovery request status
export type RecoveryRequestStatus = 'pending' | 'in-progress' | 'resolved' | 'rejected';

// Recovery request interface
export interface RecoveryRequest {
  id: string;
  name: string;
  alternateEmail?: string;
  description: string;
  status: RecoveryRequestStatus;
  createdAt: string;
}

// ============================================
// Component Props
// ============================================

// RecoveryRequestCard Component Props
export interface RecoveryRequestCardProps {
  request: RecoveryRequest;
  onStatusChange: (requestId: string, newStatus: RecoveryRequestStatus) => void;
  onSendRecoveryEmail: (requestId: string) => void;
}

// RecoveryInfoBox Component Props
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RecoveryInfoBoxProps {
  // No props needed - static content
}
