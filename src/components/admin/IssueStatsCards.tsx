// src/components/admin/IssueStatsCards.tsx
// Stats cards for Issue Management

interface IssueStatsCardsProps {
  stats: {
    open: number;
    inProgress: number;
    done: number;
    urgentCount: number;
  };
}

export default function IssueStatsCards({ stats }: IssueStatsCardsProps) {
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
      gap: '12px', 
      marginBottom: '20px' 
    }}>
      <div style={{ 
        background: '#dbeafe', 
        padding: '14px 16px', 
        borderRadius: '10px', 
        border: '1px solid #3b82f6',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '24px' }}>🔵</div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e40af', lineHeight: '1' }}>{stats.open}</div>
          <div style={{ fontSize: '12px', color: '#1e40af', marginTop: '2px' }}>Open</div>
        </div>
      </div>
      <div style={{ 
        background: '#fef3c7', 
        padding: '14px 16px', 
        borderRadius: '10px', 
        border: '1px solid #ca8a04',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '24px' }}>🟡</div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#92400e', lineHeight: '1' }}>{stats.inProgress}</div>
          <div style={{ fontSize: '12px', color: '#92400e', marginTop: '2px' }}>In Progress</div>
        </div>
      </div>
      <div style={{ 
        background: '#dcfce7', 
        padding: '14px 16px', 
        borderRadius: '10px', 
        border: '1px solid #16a34a',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '24px' }}>✅</div>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#166534', lineHeight: '1' }}>{stats.done}</div>
          <div style={{ fontSize: '12px', color: '#166534', marginTop: '2px' }}>Done</div>
        </div>
      </div>
      {stats.urgentCount > 0 && (
        <div style={{ 
          background: '#fee2e2', 
          padding: '14px 16px', 
          borderRadius: '10px', 
          border: '1px solid #dc2626',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ fontSize: '24px' }}>🚨</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#991b1b', lineHeight: '1' }}>{stats.urgentCount}</div>
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '2px' }}>Urgent</div>
          </div>
        </div>
      )}
    </div>
  );
}
