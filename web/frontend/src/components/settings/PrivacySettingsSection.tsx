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
    <div className="settings-section">
      <h3>🔒 Privacy Settings</h3>
      <p className="section-description">Control what others can see on your profile</p>

      <div className="privacy-toggles">
        <div className="privacy-item">
          <label>
            <input
              type="checkbox"
              checked={settings.show_email}
              onChange={() => handleToggle('show_email')}
              disabled={saving}
            />
            <span>Show Email Address</span>
          </label>
        </div>

        <div className="privacy-item">
          <label>
            <input
              type="checkbox"
              checked={settings.show_bio}
              onChange={() => handleToggle('show_bio')}
              disabled={saving}
            />
            <span>Show Bio</span>
          </label>
        </div>

        <div className="privacy-item">
          <label>
            <input
              type="checkbox"
              checked={settings.show_instruments}
              onChange={() => handleToggle('show_instruments')}
              disabled={saving}
            />
            <span>Show Skills & Instruments</span>
          </label>
        </div>

        <div className="privacy-item">
          <label>
            <input
              type="checkbox"
              checked={settings.show_projects}
              onChange={() => handleToggle('show_projects')}
              disabled={saving}
            />
            <span>Show Projects</span>
          </label>
        </div>

        <div className="privacy-item">
          <label>
            <input
              type="checkbox"
              checked={settings.show_followers}
              onChange={() => handleToggle('show_followers')}
              disabled={saving}
            />
            <span>Show Followers & Following</span>
          </label>
        </div>
      </div>
    </div>
  );
}
