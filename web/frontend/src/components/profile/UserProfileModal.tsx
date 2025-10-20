// src/components/profile/UserProfileModal.tsx
// User Profile Modal - Quick View Popup

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';
import { useFollowers } from '../../hooks/useFollowers';
import Avatar from '../ui/Avatar';

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

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
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
    loadProfile();
    loadStats();
    loadSocialStatus();
  }, [userId]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, bio, avatar_url, artist_type, instruments, role, created_at')
      .eq('id', userId)
      .single();

    setProfile(data);
    setLoading(false);
  };

  const loadStats = async () => {
    const [friendsData, followersData, followingData, projectsData] = await Promise.all([
      supabase.from('friendships').select('id').or(`user_id.eq.${userId},friend_id.eq.${userId}`).eq('status', 'accepted'),
      supabase.from('followers').select('id').eq('following_id', userId),
      supabase.from('followers').select('id').eq('follower_id', userId),
      supabase.from('project_collaborators').select('id').eq('user_id', userId),
    ]);

    setStats({
      friends: friendsData.data?.length || 0,
      followers: followersData.data?.length || 0,
      following: followingData.data?.length || 0,
      projects: projectsData.data?.length || 0,
    });
  };

  const loadSocialStatus = async () => {
    if (isOwnProfile) return;
    const [friendship, following] = await Promise.all([
      getFriendshipStatus(userId),
      checkFollowing(userId),
    ]);
    setFriendshipStatus(friendship === 'friends' ? 'friends' : friendship === 'pending_sent' ? 'pending' : 'none');
    setIsFollowing(following);
  };

  const handleFollow = async () => {
    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId);
    }
    loadSocialStatus();
  };

  const handleFriendRequest = async () => {
    await sendFriendRequest(userId);
    loadSocialStatus();
  };

  const handleViewFullProfile = () => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  const handleMessage = () => {
    // TODO: Open chat with user
    console.log('Open chat with', userId);
  };

  if (loading || !profile) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Profile Header */}
        <div className="profile-modal-header">
          <Avatar
            avatarUrl={profile.avatar_url || null}
            initial={getInitials()}
            fullName={profile.full_name}
            size="xlarge"
            shape="rounded"
          />
          <div className="profile-modal-info">
            <h2>{profile.full_name}</h2>
            <p className="username">@{profile.username}</p>
            <div className="profile-badges">
              <span className="badge badge-role">{getRoleBadge()}</span>
              <span className="badge badge-artist">{getArtistTypeLabel()}</span>
            </div>
          </div>
        </div>

        {/* Instruments/Skills */}
        {profile.instruments && profile.instruments.length > 0 && (
          <div className="profile-modal-section">
            <h3>🎹 Skills & Instruments</h3>
            <div className="instruments-tags">
              {profile.instruments.map(instrument => (
                <span key={instrument} className="instrument-tag">{instrument}</span>
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="profile-modal-section">
            <h3>📝 Bio</h3>
            <p>{profile.bio}</p>
          </div>
        )}

        {/* Stats */}
        <div className="profile-modal-stats">
          <div className="stat-item">
            <span className="stat-number">{stats.friends}</span>
            <span className="stat-label">Friends</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.followers}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.following}</span>
            <span className="stat-label">Following</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.projects}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>

        {/* Actions */}
        <div className="profile-modal-actions">
          {!isOwnProfile && (
            <>
              {friendshipStatus === 'none' && (
                <button className="btn btn-primary" onClick={handleFriendRequest}>
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

              <button className="btn btn-secondary" onClick={handleFollow}>
                {isFollowing ? '✓ Following' : '➕ Follow'}
              </button>

              <button className="btn btn-secondary" onClick={handleMessage}>
                💬 Message
              </button>
            </>
          )}

          <button className="btn btn-outline" onClick={handleViewFullProfile}>
            {isOwnProfile ? '⚙️ Edit Profile' : '👁️ View Full Profile'} →
          </button>
        </div>
      </div>
    </div>
  );
}
