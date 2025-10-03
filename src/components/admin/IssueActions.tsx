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
    <div className="issue-actions">
      <div className="issue-actions__header">
        <h1 className="issue-actions__title">
          <span>🐛</span>
          <span>Issue Management</span>
        </h1>
        <p className="issue-actions__subtitle">
          {totalIssues} Issues gesamt
        </p>
      </div>
      <div className="issue-actions__buttons">
        <button 
          className="btn btn-secondary" 
          onClick={onExport} 
          title="Issues als JSON exportieren"
        >
          <span>📥</span>
          <span>JSON</span>
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onSaveMarkdown} 
          title="Issues als Markdown-Report speichern"
        >
          <span>📝</span>
          <span>MD</span>
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={onRefresh} 
          title="Neu laden"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
        <button 
          className="btn btn-primary"
          onClick={onCreateNew}
        >
          <span>➕</span>
          <span>New Issue</span>
        </button>
      </div>
    </div>
  );
}
