// Privacy Settings Section
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

export default function PrivacySettingsSection() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [settings, setSettings] = useState<PrivacySettings>({
    show_email: false,
    show_bio: true,
    show_instruments: true,
    show_projects: true,
    show_followers: true,
  });
  const [saving, setSaving] = useState(false);

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

    setSaving(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ privacy_settings: newSettings })
      .eq('id', user!.id);

    setSaving(false);

    if (updateError) {
      error('Failed to save privacy settings');
    } else {
      success('Privacy settings updated');
    }
  };

  return (
    <div className="settings-section privacy-settings-section">
      <div className="section-header">
        <h3>🔒 Privacy Settings</h3>
        <p className="section-description">Control what others can see on your profile</p>
      </div>

      <div className="privacy-toggles">
        {[
          { key: 'show_email' as const, label: 'Email Address', description: 'Show your email to other users' },
          { key: 'show_bio' as const, label: 'Bio', description: 'Display your bio on your profile' },
          { key: 'show_instruments' as const, label: 'Skills & Instruments', description: 'Show your musical skills' },
          { key: 'show_projects' as const, label: 'Projects', description: 'Display your project list' },
          { key: 'show_followers' as const, label: 'Followers & Following', description: 'Show your social connections' },
        ].map(({ key, label, description }) => (
          <div key={key} className="privacy-toggle-item">
            <div className="toggle-info">
              <span className="toggle-label">{label}</span>
              <span className="toggle-description">{description}</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={() => handleToggle(key)}
                disabled={saving}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
