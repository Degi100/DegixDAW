import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { useProfile } from '../useProfile';
import { useToast } from '../useToast';
import { supabase } from '../../lib/supabase';
import type { ProfileDataState } from '../../components/settings/types/settings';

export function useProfileSection(user: User | null) {
  const { updateProfile } = useProfile(user);
  const { success, error: showError } = useToast();

  const [isUpdating, setIsUpdating] = useState(false);
  const [profileData, setProfileData] = useState<ProfileDataState>({
    firstName: user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
    lastName: user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
    fullName: user?.user_metadata?.full_name || '',
    username: user?.user_metadata?.username || '',
    displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || '',
    bio: user?.user_metadata?.bio || ''
  });

  // Load profile data from database on mount
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.warn('Error loading profile data:', error);
          return;
        }

        if (profile) {
          setProfileData({
            firstName: user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            fullName: profile.full_name || user?.user_metadata?.full_name || '',
            username: profile.username || user?.user_metadata?.username || '',
            displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || '',
            bio: user?.user_metadata?.bio || ''
          });
        }
      } catch (err) {
        console.warn('Error loading profile data:', err);
      }
    };

    loadProfileData();
  }, [user?.id, user?.user_metadata]);

  // Aktualisiere die Felder automatisch, wenn sich das User-Objekt ändert
  useEffect(() => {
    // Only update if we don't have profile data from database yet
    if (!profileData.username && !profileData.fullName) {
      setProfileData({
        firstName: user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || '',
        lastName: user?.user_metadata?.last_name || user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        fullName: user?.user_metadata?.full_name || '',
        username: user?.user_metadata?.username || '',
        displayName: user?.user_metadata?.display_name || user?.user_metadata?.full_name || '',
        bio: user?.user_metadata?.bio || ''
      });
    }
  }, [user, profileData.username, profileData.fullName]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
      await updateProfile({
        full_name: fullName || profileData.fullName,
        username: profileData.username
      });
      setProfileData(prev => ({ ...prev, fullName: fullName || prev.fullName }));
      success('Profil erfolgreich gespeichert! ✅');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      showError(`Fehler beim Speichern: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    profileData,
    setProfileData,
    isUpdating,
    handleProfileSave
  };
}
