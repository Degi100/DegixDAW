// Privacy Toggles for Profile Section
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface PrivacySettings {
  show_email: boolean;
  show_bio: boolean;
  show_instruments: boolean;
  show_projects: boolean;
  show_followers: boolean;
}

export default function ProfilePrivacyToggles() {
  const { user } = useAuth();
  const { success } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>({
    show_email: false,
    show_bio: true,
    show_instruments: true,
    show_projects: true,
    show_followers: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('privacy_settings')
      .eq('id', user.id)
      .single();

    if (data?.privacy_settings) {
      setSettings(data.privacy_settings);
    }
  };

  const handleToggle = async (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    await supabase
      .from('profiles')
      .update({ privacy_settings: newSettings })
      .eq('id', user!.id);

    success('Privacy updated');
  };

  return (
    <div className="privacy-toggles-compact">
      <h4>🔒 Privacy Settings</h4>
      <p className="privacy-hint">Control what others can see on your profile</p>

      {Object.entries({
        show_email: 'Email Address',
        show_bio: 'Bio',
        show_instruments: 'Skills & Instruments',
        show_projects: 'Projects',
        show_followers: 'Followers & Following',
      }).map(([key, label]) => (
        <label key={key} className="privacy-toggle-item">
          <input
            type="checkbox"
            checked={settings[key as keyof PrivacySettings]}
            onChange={() => handleToggle(key as keyof PrivacySettings)}
          />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}
