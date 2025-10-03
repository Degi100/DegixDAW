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

      success(`Deactivated ${userIds.length} users`);
      clearSelection();
      onUsersUpdated();
    } catch {
      error('Failed to deactivate users');
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

      success(`Deleted ${userIds.length} users`);
      clearSelection();
      onUsersUpdated();
    } catch {
      error('Failed to delete users');
    }
  };

  return {
    handleBulkActivate,
    handleBulkDeactivate,
    handleBulkDelete
  };
}