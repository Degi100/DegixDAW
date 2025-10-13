// src/hooks/useBulkOperations.ts
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

export function useBulkOperations(selectedUsers: Set<string>, onUsersUpdated: () => void, clearSelection: () => void) {
  const { success, error } = useToast();

  const handleBulkActivate = async () => {
    try {
      const userIds = Array.from(selectedUsers);
      const { error: bulkError } = await supabase
        .from('profiles')
        .update({ is_active: true })
        .in('id', userIds);

      if (bulkError) throw bulkError;

      success(`Activated ${userIds.length} users`);
      clearSelection();
      onUsersUpdated();
    } catch {
      error('Failed to activate users');
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      const userIds = Array.from(selectedUsers);
      const { error: bulkError } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .in('id', userIds);

      if (bulkError) throw bulkError;

      success(`${userIds.length} Benutzer deaktiviert`);
      clearSelection();
      onUsersUpdated();
    } catch {
      error('Fehler beim Deaktivieren der Benutzer');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.size} users? This action cannot be undone.`)) return;

    try {
      const userIds = Array.from(selectedUsers);

      // Delete from auth first
      for (const userId of userIds) {
        await supabase.auth.admin.deleteUser(userId);
      }

      success(`${userIds.length} Benutzer gelöscht`);
      clearSelection();
      onUsersUpdated();
    } catch {
      error('Fehler beim Löschen der Benutzer');
    }
  };

  const handleBulkRoleChange = async (newRole: 'user' | 'beta_user' | 'moderator' | 'admin') => {
    try {
      const userIds = Array.from(selectedUsers);
      const { error: bulkError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .in('id', userIds);

      if (bulkError) throw bulkError;

      const roleNames = {
        user: 'User',
        beta_user: 'Beta Tester',
        moderator: 'Moderator',
        admin: 'Admin'
      };

      success(`${userIds.length} Benutzer zu ${roleNames[newRole]} geändert`);
      clearSelection();
      onUsersUpdated();
    } catch (err) {
      console.error('Bulk role change error:', err);
      error('Fehler beim Ändern der Rollen');
    }
  };

  return {
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete,
    handleBulkRoleChange
  };
}