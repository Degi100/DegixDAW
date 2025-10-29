// Temporary test page for project versions
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useVersions } from '../../hooks/useVersions';

export default function TestVersions() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const {
    versions,
    loading,
    creating,
    loadVersions,
    createVersion,
  } = useVersions(projectId || '');

  const [tag, setTag] = useState('');
  const [changelog, setChangelog] = useState('');

  useEffect(() => {
    if (projectId) {
      loadVersions();
    }
  }, [projectId, loadVersions]);

  const handleCreateVersion = async () => {
    if (!user) return;

    try {
      await createVersion(user.id, {
        version_tag: tag || undefined,
        changes: changelog || undefined,
      });
      setTag('');
      setChangelog('');
    } catch (err) {
      console.error('Failed to create version:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🧪 Test Project Versions</h1>
      <p>Project ID: <code>{projectId}</code></p>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Create Version</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Version Tag (optional):
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g., v1.0, beta, final"
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Changelog (optional):
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="What changed in this version?"
              style={{ marginLeft: '10px', padding: '5px', width: '400px', height: '100px' }}
            />
          </label>
        </div>
        <button
          onClick={handleCreateVersion}
          disabled={creating || !user}
          style={{
            padding: '10px 20px',
            background: creating ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: creating ? 'not-allowed' : 'pointer',
          }}
        >
          {creating ? 'Creating...' : 'Create Version Snapshot'}
        </button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Versions ({versions.length})</h2>
        {loading && <p>Loading versions...</p>}
        {!loading && versions.length === 0 && <p>No versions yet. Create one above!</p>}

        {versions.map((version) => (
          <div
            key={version.id}
            style={{
              padding: '15px',
              margin: '10px 0',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Version {version.version_number}</strong>
                {version.version_tag && (
                  <span style={{
                    marginLeft: '10px',
                    padding: '2px 8px',
                    background: '#e3f2fd',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    {version.version_tag}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {new Date(version.created_at).toLocaleString()}
              </div>
            </div>

            {version.changes && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#555' }}>
                {version.changes}
              </div>
            )}

            <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
              Created by: {version.creator.username}
            </div>

            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#007bff' }}>
                View snapshot data
              </summary>
              <pre style={{
                marginTop: '10px',
                padding: '10px',
                background: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '11px',
                overflow: 'auto',
                maxHeight: '300px',
              }}>
                {JSON.stringify(version.snapshot_data, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
