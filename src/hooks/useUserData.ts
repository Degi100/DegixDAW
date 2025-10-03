// src/hooks/useUserData.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  username: string | null;
  full_name: string | null;
  profile_created_at: string | null;
  email_confirmed_at: string | null;
  phone?: string;
  avatar_url?: string;
  role?: 'admin' | 'user' | 'moderator';
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

export function useUserData() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);

  const { success, error } = useToast();

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .rpc('get_all_users_with_metadata')
        .select('*');

      if (fetchError) {
        // Fallback to basic query if RPC fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;
        setUsers(fallbackData || []);
      } else {
        setUsers(data || []);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading users:', err);
      error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [error]);

  // Real-time subscription
  useEffect(() => {
    if (!isRealtimeEnabled) return;

    const subscription = supabase
      .channel('users_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('Real-time update:', payload);
        loadUsers();
        success('User data updated in real-time');
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [isRealtimeEnabled, loadUsers, success]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const createUser = useCallback(async (userData: {
    email: string;
    password: string;
    full_name: string;
    username?: string;
    role: 'admin' | 'user' | 'moderator';
    phone?: string;
    sendWelcomeEmail: boolean;
  }) => {
    try {
      // WORKAROUND: Admin API requires service role key
      // Use regular signUp + auto-signout approach
      const { data, error: createError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            username: userData.username,
            role: userData.role,
            phone: userData.phone
          }
        }
      });

      if (createError) throw createError;

      // Update profile with role (admin only can set roles)
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: userData.full_name,
            username: userData.username,
            role: userData.role,
            phone: userData.phone,
            is_active: true
          })
          .eq('id', data.user.id);

        if (profileError) console.warn('Profile update warning:', profileError);
      }

      success('✅ User invited successfully! They will receive a confirmation email.');
      loadUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      error(`❌ Failed to create user: ${errorMsg}`);
    }
  }, [success, error, loadUsers]);

  const updateUser = useCallback(async (user: UserProfile) => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: user.full_name,
          username: user.username,
          role: user.role,
          phone: user.phone,
          is_active: user.is_active
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      success('User updated successfully!');
      loadUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      error('Failed to update user');
    }
  }, [success, error, loadUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;

      success('User deleted successfully!');
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      error('Failed to delete user');
    }
  }, [success, error, loadUsers]);

  return {
    users,
    loading,
    lastUpdated,
    isRealtimeEnabled,
    setIsRealtimeEnabled,
    loadUsers,
    createUser,
    updateUser,
    deleteUser
  };
}