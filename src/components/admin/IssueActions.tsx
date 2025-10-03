// src/components/admin/IssueActions.tsx
// Action buttons for Issue Management header

interface IssueActionsProps {
  totalIssues: number;
  onExport: () => void;
  onSaveMarkdown: () => void;
  onRefresh: () => void;
  onCreateNew: () => void;
}

export default function IssueActions({
  totalIssues,
  onExport,
  onSaveMarkdown,
  onRefresh,
  onCreateNew,
}: IssueActionsProps) {
  return (
    <div className="admin-issues-header">
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>🐛</span>
          <span>Issue Management</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>
          {totalIssues} Issues gesamt
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={onExport} 
          title="Issues als JSON exportieren"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>📥</span>
          <span>JSON</span>
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onSaveMarkdown} 
          title="Issues als Markdown-Report speichern"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>📝</span>
          <span>MD</span>
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onRefresh} 
          title="Neu laden"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
        <button 
          className="btn btn-primary"
          onClick={onCreateNew}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>➕</span>
          <span>New Issue</span>
        </button>
      </div>
    </div>
  );
}
