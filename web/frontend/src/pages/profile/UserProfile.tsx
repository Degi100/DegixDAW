// src/pages/profile/UserProfile.tsx
// Full User Profile Page

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';
import { useFollowers } from '../../hooks/useFollowers';
import Avatar from '../../components/ui/Avatar';

interface UserProfileData {
  id: string;
  username: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  artist_type?: 'musician' | 'producer' | 'mixer' | 'listener' | 'other';
  instruments?: string[];
  role?: 'user' | 'moderator' | 'admin';
  created_at: string;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { sendFriendRequest, getFriendshipStatus } = useFriends();
  const { followUser, unfollowUser, isFollowing: checkFollowing } = useFollowers();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [stats, setStats] = useState({ friends: 0, followers: 0, following: 0, projects: 0 });
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (!userId) return;
    loadProfile();
    loadStats();
    if (!isOwnProfile) {
      loadSocialStatus();
    }
  }, [userId, isOwnProfile]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, artist_type, instruments, role, created_at')
      .eq('id', userId!)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const loadStats = async () => {
    const [friendsData, followersData, followingData, projectsData] = await Promise.all([
      supabase.from('friendships').select('id').or(`user_id.eq.${userId},friend_id.eq.${userId}`).eq('status', 'accepted'),
      supabase.from('followers').select('id').eq('following_id', userId!),
      supabase.from('followers').select('id').eq('follower_id', userId!),
      supabase.from('project_collaborators').select('id').eq('user_id', userId!),
    ]);

    setStats({
      friends: friendsData.data?.length || 0,
      followers: followersData.data?.length || 0,
      following: followingData.data?.length || 0,
      projects: projectsData.data?.length || 0,
    });
  };

  const loadSocialStatus = async () => {
    if (!userId || isOwnProfile) return;
    const [friendship, following] = await Promise.all([
      getFriendshipStatus(userId),
      checkFollowing(userId),
    ]);
    setFriendshipStatus(friendship === 'friends' ? 'friends' : friendship === 'pending_sent' ? 'pending' : 'none');
    setIsFollowing(following);
  };

  if (loading || !profile) {
    return <div className="loading">Loading profile...</div>;
  }

  const getInitials = () => {
    return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = () => {
    const badges = {
      admin: '👑 Admin',
      moderator: '🛡️ Moderator',
      user: '👤 Member',
    };
    return badges[profile.role || 'user'];
  };

  const getArtistTypeLabel = () => {
    const labels = {
      musician: '🎸 Musician',
      producer: '🎛️ Producer',
      mixer: '🎚️ Mix Engineer',
      listener: '🎧 Listener',
      other: '🎵 Music Enthusiast',
    };
    return labels[profile.artist_type || 'listener'];
  };

  return (
    <div className="dashboard-corporate">
      <main className="dashboard-main">
        <div className="dashboard-container">
          <section className="welcome-section-corporate">
            <div className="welcome-card-corporate">
              {/* Profile Section */}
              <div className="profile-section">
                <Avatar
                  avatarUrl={profile.avatar_url || null}
                  initial={getInitials()}
                  fullName={profile.full_name}
                  size="xlarge"
                  shape="rounded"
                  className="profile-avatar"
                />

                <div className="profile-info">
                  <div className="greeting">
                    <h2 className="user-display-name">{profile.full_name}</h2>
                    <span className="greeting-text">@{profile.username}</span>
                  </div>

                  <div className="user-details">
                    {/* Role */}
                    <div className="detail-row">
                      <span className="detail-label">Role:</span>
                      <span className="detail-value">{getRoleBadge()}</span>
                    </div>

                    {/* Artist Type */}
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{getArtistTypeLabel()}</span>
                    </div>

                    {/* Instruments */}
                    {profile.instruments && profile.instruments.length > 0 && (
                      <div className="detail-row">
                        <span className="detail-label">🎹 Skills:</span>
                        <span className="detail-value">
                          {profile.instruments.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Bio */}
                    {profile.bio && (
                      <div className="bio-section">
                        <span className="detail-label">📝 Bio:</span>
                        <span className="detail-value bio-text">{profile.bio}</span>
                      </div>
                    )}

                    {/* Member Since */}
                    <div className="detail-row">
                      <span className="detail-label">📅 Member since:</span>
                      <span className="detail-value">
                        {new Date(profile.created_at).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="stats-section">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.friends}</div>
                    <div className="stat-label">Friends</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">👁️</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.followers}</div>
                    <div className="stat-label">Followers</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📤</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.following}</div>
                    <div className="stat-label">Following</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🎵</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.projects}</div>
                    <div className="stat-label">Projects</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="actions-section">
                {isOwnProfile ? (
                  // Own Profile Actions
                  <div className="primary-actions">
                    <button className="btn btn-primary" onClick={() => navigate('/settings')}>
                      ⚙️ Profil bearbeiten
                    </button>
                    <button className="btn btn-outline" onClick={() => navigate(-1)}>
                      ← Zurück
                    </button>
                  </div>
                ) : (
                  // Other User Actions
                  <>
                    <div className="primary-actions">
                      {friendshipStatus === 'none' && (
                        <button
                          className="btn btn-primary"
                          onClick={async () => {
                            await sendFriendRequest(userId!);
                            loadSocialStatus();
                          }}
                        >
                          👥 Add Friend
                        </button>
                      )}
                      {friendshipStatus === 'pending' && (
                        <button className="btn btn-secondary" disabled>
                          ⏳ Request Sent
                        </button>
                      )}
                      {friendshipStatus === 'friends' && (
                        <button className="btn btn-success" disabled>
                          ✅ Friends
                        </button>
                      )}

                      <button
                        className="btn btn-outline"
                        onClick={async () => {
                          if (isFollowing) {
                            await unfollowUser(userId!);
                          } else {
                            await followUser(userId!);
                          }
                          loadSocialStatus();
                        }}
                      >
                        {isFollowing ? '✓ Following' : '➕ Follow'}
                      </button>
                    </div>

                    <div className="secondary-actions">
                      <button className="btn btn-outline btn-small">
                        💬 Send Message
                      </button>
                      <button className="btn btn-outline btn-small" onClick={() => navigate(-1)}>
                        ← Back
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
