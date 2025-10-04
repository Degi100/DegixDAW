-- ============================================
-- SOCIAL CONNECTIONS SETUP
-- Friendships + Followers System
-- ============================================

-- ============================================
-- 1. FRIENDSHIPS TABLE (bidirektional)
-- ============================================
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- ============================================
-- 2. FOLLOWERS TABLE (einseitig)
-- ============================================
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.followers(following_id);

-- ============================================
-- 3. RLS POLICIES - FRIENDSHIPS
-- ============================================

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their own friendships (sent or received)
CREATE POLICY "Users can view own friendships"
  ON public.friendships
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON public.friendships
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'pending'
  );

-- Users can update friendships they're involved in
CREATE POLICY "Users can update own friendships"
  ON public.friendships
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- Users can delete their own friendships
CREATE POLICY "Users can delete own friendships"
  ON public.friendships
  FOR DELETE
  USING (
    auth.uid() = user_id OR 
    auth.uid() = friend_id
  );

-- ============================================
-- 4. RLS POLICIES - FOLLOWERS
-- ============================================

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Anyone can view followers (public information)
CREATE POLICY "Anyone can view followers"
  ON public.followers
  FOR SELECT
  USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON public.followers
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
  ON public.followers
  FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function: Get friend count for a user
CREATE OR REPLACE FUNCTION get_friend_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.friendships
    WHERE (user_id = target_user_id OR friend_id = target_user_id)
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get follower count for a user
CREATE OR REPLACE FUNCTION get_follower_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.followers
    WHERE following_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.followers
    WHERE follower_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if users are friends
CREATE OR REPLACE FUNCTION are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.friendships
    WHERE ((user_id = user1_id AND friend_id = user2_id)
       OR (user_id = user2_id AND friend_id = user1_id))
      AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user follows another
CREATE OR REPLACE FUNCTION is_following(follower_user_id UUID, following_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.followers
    WHERE follower_id = follower_user_id 
      AND following_id = following_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. TRIGGERS - Auto-update timestamps
-- ============================================

-- Update updated_at on friendships
CREATE OR REPLACE FUNCTION update_friendship_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF (NEW.status != OLD.status AND NEW.status IN ('accepted', 'rejected', 'blocked')) THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_friendship_timestamp
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friendship_timestamp();

-- ============================================
-- DONE! 🎉
-- ============================================
-- Run this script with: npm run db:sql social_connections_setup.sql
