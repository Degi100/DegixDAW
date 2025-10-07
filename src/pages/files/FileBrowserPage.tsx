import { useAuth } from '../../hooks/useAuth';
import FileBrowser from '../../components/files/FileBrowser';

export default function FileBrowserPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Bitte melden Sie sich an, um auf Ihre Dateien zuzugreifen.</p>
      </div>
    );
  }

  return <FileBrowser userId={user.id} />;
}
