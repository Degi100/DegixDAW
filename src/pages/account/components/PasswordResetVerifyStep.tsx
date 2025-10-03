// ============================================
// PASSWORD RESET VERIFY STEP
// Token verification loading state
// ============================================

import { LoadingOverlay } from '../../../components/ui/Loading';

export default function PasswordResetVerifyStep() {
  return (
    <div className="card card-large">
      <div className="card-header">
        <h1>🔍 Recovery-Link wird verifiziert...</h1>
        <p>Bitte warten Sie, während wir Ihren Recovery-Link überprüfen.</p>
      </div>
      <LoadingOverlay message="Verifiziere Recovery-Token..." />
    </div>
  );
}
