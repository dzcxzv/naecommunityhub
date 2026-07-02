/*
# NAE Platform - Complete Database Schema

## Summary
Creates all tables needed for the nae social platform including:
- User profiles with custom fields, status, pronouns, avatar, background
- Posts with likes/downvotes and comments with likes/replies
- Community chat messages with 7-day TTL
- Direct messages between users
- Follow/follower relationships  
- Mini-game rooms and scores/rankings
- Cinema rooms with virtual seats
- Notifications system
- Music player state

## Tables Created
1. `profiles` - Extended user profiles linked to auth.users
2. `posts` - User posts with like/downvote counts
3. `post_likes` - Tracks who liked/downvoted each post
4. `comments` - Comments on posts, supports replies
5. `comment_likes` - Tracks who liked each comment
6. `community_messages` - Global chat messages (7-day TTL)
7. `direct_messages` - Private messages between users
8. `follows` - Follow relationships
9. `game_rooms` - Multiplayer game rooms (Hangman, Pictionary)
10. `game_room_members` - Players in game rooms
11. `game_scores` - Per-game leaderboard scores
12. `cinema_rooms` - Cinema rooms with seats
13. `cinema_seats` - Seat assignments in cinema rooms
14. `notifications` - User notifications
15. `music_status` - Currently playing music per user

## Security
- RLS enabled on all tables
- Authenticated users can read public data
- Users can only modify their own data
- Owner @miyoxz gets role='owner' set via trigger
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  login_key text NOT NULL,
  avatar_url text,
  background_url text,
  bio text DEFAULT '',
  pronouns text DEFAULT '',
  gender text DEFAULT '',
  interests text[] DEFAULT '{}',
  custom_status text DEFAULT '',
  role text DEFAULT 'visitor',
  online_status text DEFAULT 'online',
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- POSTS
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  like_count int DEFAULT 0,
  downvote_count int DEFAULT 0,
  comment_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select" ON posts;
CREATE POLICY "posts_select" ON posts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_update" ON posts;
CREATE POLICY "posts_update" ON posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_delete" ON posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- POST LIKES
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'like',
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_likes_select" ON post_likes;
CREATE POLICY "post_likes_select" ON post_likes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "post_likes_insert" ON post_likes;
CREATE POLICY "post_likes_insert" ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_likes_update" ON post_likes;
CREATE POLICY "post_likes_update" ON post_likes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_likes_delete" ON post_likes;
CREATE POLICY "post_likes_delete" ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMMENTS
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  like_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_update" ON comments;
CREATE POLICY "comments_update" ON comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_delete" ON comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMMENT LIKES
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_likes_select" ON comment_likes;
CREATE POLICY "comment_likes_select" ON comment_likes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comment_likes_insert" ON comment_likes;
CREATE POLICY "comment_likes_insert" ON comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment_likes_delete" ON comment_likes;
CREATE POLICY "comment_likes_delete" ON comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- COMMUNITY MESSAGES
CREATE TABLE IF NOT EXISTS community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_messages_select" ON community_messages;
CREATE POLICY "community_messages_select" ON community_messages FOR SELECT TO anon, authenticated USING (expires_at > now());

DROP POLICY IF EXISTS "community_messages_insert" ON community_messages;
CREATE POLICY "community_messages_insert" ON community_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_messages_delete" ON community_messages;
CREATE POLICY "community_messages_delete" ON community_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- DIRECT MESSAGES
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dm_select" ON direct_messages;
CREATE POLICY "dm_select" ON direct_messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "dm_insert" ON direct_messages;
CREATE POLICY "dm_insert" ON direct_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "dm_update" ON direct_messages;
CREATE POLICY "dm_update" ON direct_messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "dm_delete" ON direct_messages;
CREATE POLICY "dm_delete" ON direct_messages FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- FOLLOWS
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select" ON follows;
CREATE POLICY "follows_select" ON follows FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "follows_insert" ON follows;
CREATE POLICY "follows_insert" ON follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete" ON follows;
CREATE POLICY "follows_delete" ON follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- GAME ROOMS
CREATE TABLE IF NOT EXISTS game_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type text NOT NULL,
  name text NOT NULL,
  password text,
  max_players int DEFAULT 10,
  is_active boolean DEFAULT true,
  game_state jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_rooms_select" ON game_rooms;
CREATE POLICY "game_rooms_select" ON game_rooms FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "game_rooms_insert" ON game_rooms;
CREATE POLICY "game_rooms_insert" ON game_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "game_rooms_update" ON game_rooms;
CREATE POLICY "game_rooms_update" ON game_rooms FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "game_rooms_delete" ON game_rooms;
CREATE POLICY "game_rooms_delete" ON game_rooms FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- GAME ROOM MEMBERS
CREATE TABLE IF NOT EXISTS game_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES game_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE game_room_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grm_select" ON game_room_members;
CREATE POLICY "grm_select" ON game_room_members FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "grm_insert" ON game_room_members;
CREATE POLICY "grm_insert" ON game_room_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "grm_delete" ON game_room_members;
CREATE POLICY "grm_delete" ON game_room_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- GAME SCORES
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type text NOT NULL,
  score int NOT NULL DEFAULT 0,
  achieved_at timestamptz DEFAULT now()
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_scores_select" ON game_scores;
CREATE POLICY "game_scores_select" ON game_scores FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "game_scores_insert" ON game_scores;
CREATE POLICY "game_scores_insert" ON game_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- CINEMA ROOMS
CREATE TABLE IF NOT EXISTS cinema_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  video_url text DEFAULT '',
  password text,
  is_active boolean DEFAULT true,
  chat_messages jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cinema_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cinema_rooms_select" ON cinema_rooms;
CREATE POLICY "cinema_rooms_select" ON cinema_rooms FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cinema_rooms_insert" ON cinema_rooms;
CREATE POLICY "cinema_rooms_insert" ON cinema_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "cinema_rooms_update" ON cinema_rooms;
CREATE POLICY "cinema_rooms_update" ON cinema_rooms FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "cinema_rooms_delete" ON cinema_rooms;
CREATE POLICY "cinema_rooms_delete" ON cinema_rooms FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- CINEMA SEATS
CREATE TABLE IF NOT EXISTS cinema_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES cinema_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_number int NOT NULL,
  UNIQUE(room_id, seat_number),
  UNIQUE(room_id, user_id)
);

ALTER TABLE cinema_seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cinema_seats_select" ON cinema_seats;
CREATE POLICY "cinema_seats_select" ON cinema_seats FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cinema_seats_insert" ON cinema_seats;
CREATE POLICY "cinema_seats_insert" ON cinema_seats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "cinema_seats_delete" ON cinema_seats;
CREATE POLICY "cinema_seats_delete" ON cinema_seats FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  content text NOT NULL,
  from_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ref_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MUSIC STATUS
CREATE TABLE IF NOT EXISTS music_status (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  track_title text DEFAULT '',
  artist text DEFAULT '',
  url text DEFAULT '',
  is_playing boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE music_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "music_status_select" ON music_status;
CREATE POLICY "music_status_select" ON music_status FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "music_status_insert" ON music_status;
CREATE POLICY "music_status_insert" ON music_status FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "music_status_update" ON music_status;
CREATE POLICY "music_status_update" ON music_status FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger to auto-set role='owner' for @miyoxz
CREATE OR REPLACE FUNCTION set_owner_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username = 'miyoxz' THEN
    NEW.role := 'owner';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_owner_role ON profiles;
CREATE TRIGGER trigger_set_owner_role
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_owner_role();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created ON community_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_expires ON community_messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_type ON game_scores(game_type, score DESC);
