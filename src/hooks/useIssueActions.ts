// src/hooks/useIssueActions.ts
// Custom hook for all issue action handlers

import { useState } from 'react';
import type { Issue, NewIssue } from './useIssues';
import type { IssueFormData } from '../components/admin/IssueModal';
import { useToast } from './useToast';

// Priority configuration  
const priorityConfig: Record<Issue['priority'], { emoji: string; color: string; label: string }> = {
  critical: { emoji: '🚨', color: '#dc2626', label: 'Critical' },
  high: { emoji: '🔴', color: '#ea580c', label: 'High' },
  medium: { emoji: '🟡', color: '#ca8a04', label: 'Medium' },
  low: { emoji: '🟢', color: '#16a34a', label: 'Low' },
};

interface IssueStats {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  closed: number;
  highPriority: number;
  criticalPriority: number;
  urgentCount: number;
}

export function useIssueActions(
  createIssue: (data: NewIssue) => Promise<{ success: boolean; data?: Issue; error?: string }>,
  updateIssue: (id: string, updates: Partial<Issue>) => Promise<{ success: boolean; data?: Issue; error?: string }>,
  deleteIssue: (id: string) => Promise<{ success: boolean; error?: string }>,
  getStats: () => IssueStats
) {
  const { success: showSuccess, error: showError } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const handleCreateClick = () => {
    setSelectedIssue(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEditClick = (issue: Issue) => {
    setSelectedIssue(issue);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDeleteClick = async (issue: Issue) => {
    if (!confirm(`Issue "${issue.title}" wirklich löschen?`)) return;
    
    const result = await deleteIssue(issue.id);
    if (result.success) {
      showSuccess('Issue erfolgreich gelöscht');
    } else {
      showError('Fehler beim Löschen des Issues');
    }
  };

  const handleModalSubmit = async (data: IssueFormData) => {
    if (modalMode === 'create') {
      const result = await createIssue(data);
      if (result.success) {
        showSuccess('Issue erfolgreich erstellt');
      }
    } else if (selectedIssue) {
      const result = await updateIssue(selectedIssue.id, data);
      if (result.success) {
        showSuccess('Issue erfolgreich aktualisiert');
      }
    }
  };

  const handleCopyClick = async (issue: Issue) => {
    // Copy issue text to clipboard
    const textToCopy = `${issue.title}\n\n${issue.description || 'Keine Beschreibung'}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      showSuccess('Text in Zwischenablage kopiert! 📋');
    } catch {
      showError('Fehler beim Kopieren in die Zwischenablage');
    }
  };

  const handleDuplicateClick = async (issue: Issue) => {
    // Duplicate issue (create new copy)
    const copiedIssue = {
      title: `${issue.title} (Kopie)`,
      description: issue.description || '',
      status: issue.status,
      priority: issue.priority,
      category: issue.category || '',
    };
    
    const result = await createIssue(copiedIssue);
    if (result.success) {
      showSuccess('Issue erfolgreich dupliziert');
    } else {
      showError('Fehler beim Duplizieren des Issues');
    }
  };

  const handlePriorityChange = async (issueId: string, newPriority: Issue['priority']) => {
    // Optimistic update in useIssues provides instant feedback
    await updateIssue(issueId, { priority: newPriority });
  };

  const handleStatusProgress = async (issueId: string, newStatus: Issue['status']) => {
    // Optimistic update in useIssues provides instant feedback
    await updateIssue(issueId, { status: newStatus });
  };

  const handleExportClick = (issues: Issue[]) => {
    const exportData = issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
      category: issue.category,
      created_at: issue.created_at,
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `issues-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess(`${exportData.length} Issues exportiert`);
  };

  const handleSaveMarkdown = async (issues: Issue[]) => {
    const stats = getStats();
    const date = new Date().toISOString().split('T')[0];
    let markdown = `# Issue Management Report\n\n`;
    markdown += `**Datum:** ${date}\n`;
    markdown += `**Total Issues:** ${stats.total}\n\n`;
    
    // Stats
    markdown += `## 📊 Statistiken\n\n`;
    markdown += `- 🔵 **Open:** ${stats.open}\n`;
    markdown += `- 🟡 **In Progress:** ${stats.inProgress}\n`;
    markdown += `- ✅ **Done:** ${stats.done}\n`;
    markdown += `- ⚪ **Closed:** ${stats.closed}\n`;
    markdown += `- 🚨 **Urgent (High/Critical):** ${stats.urgentCount}\n\n`;
    
    // Issues grouped by status
    const groupedByStatus = {
      open: issues.filter(i => i.status === 'open'),
      'in-progress': issues.filter(i => i.status === 'in-progress'),
      done: issues.filter(i => i.status === 'done'),
      closed: issues.filter(i => i.status === 'closed'),
    };

    Object.entries(groupedByStatus).forEach(([status, statusIssues]) => {
      if (statusIssues.length === 0) return;
      
      const statusConfig = {
        open: '🔵 Open',
        'in-progress': '🟡 In Progress',
        done: '✅ Done',
        closed: '⚪ Closed',
      };

      markdown += `## ${statusConfig[status as keyof typeof statusConfig]} (${statusIssues.length})\n\n`;
      
      statusIssues.forEach(issue => {
        const priorityEmoji = priorityConfig[issue.priority].emoji;
        markdown += `### ${priorityEmoji} ${issue.title}\n\n`;
        markdown += `- **Priority:** ${priorityConfig[issue.priority].label}\n`;
        markdown += `- **Category:** ${issue.category || 'N/A'}\n`;
        markdown += `- **Created:** ${new Date(issue.created_at).toLocaleDateString('de-DE')}\n`;
        if (issue.description) {
          markdown += `- **Description:** ${issue.description}\n`;
        }
        markdown += `\n---\n\n`;
      });
    });

    // Save to server (local dev) or download (production)
    const isProduction = import.meta.env.PROD;
    const isDevelopment = window.location.hostname === 'localhost';

    if (isDevelopment && !isProduction) {
      // LOCAL: Save via Express API server
      try {
        const response = await fetch('http://localhost:3001/api/save-markdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: markdown,
            filename: 'ISSUES.md', // Constant filename instead of dated
          }),
        });

        const result = await response.json();

        if (result.success) {
          showSuccess(`📝 Markdown-Report im Projekt gespeichert: ISSUES.md`);
        } else {
          throw new Error(result.error || 'Failed to save file');
        }
      } catch (error) {
        console.error('Error saving markdown:', error);
        showError('Fehler beim Speichern. Ist der API-Server gestartet? (npm run api)');
      }
    } else {
      // PRODUCTION: Download file to browser
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ISSUES.md'; // Constant filename instead of dated
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess(`📥 Markdown-Report heruntergeladen: ISSUES.md`);
    }
  };

  return {
    modalOpen,
    modalMode,
    selectedIssue,
    setModalOpen,
    handleCreateClick,
    handleEditClick,
    handleDeleteClick,
    handleModalSubmit,
    handleCopyClick,
    handleDuplicateClick,
    handlePriorityChange,
    handleStatusProgress,
    handleExportClick,
    handleSaveMarkdown,
  };
}
