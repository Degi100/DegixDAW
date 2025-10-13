// ============================================
// RECOVERY INFO BOX
// Information about recovery process
// ============================================

export default function RecoveryInfoBox() {
  return (
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
  );
}
