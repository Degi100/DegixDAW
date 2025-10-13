// src/components/ui/PageLoader.tsx
import { LoadingOverlay } from './Loading';

export default function PageLoader() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <LoadingOverlay message="Seite wird geladen..." />
    </div>
  );
}