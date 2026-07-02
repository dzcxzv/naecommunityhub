export interface Profile {
  id: string;
  username: string;
  login_key: string;
  avatar_url: string | null;
  background_url: string | null;
  bio: string;
  pronouns: string;
  gender: string;
  interests: string[];
  custom_status: string;
  role: string;
  online_status: 'online' | 'afk' | 'busy' | 'invisible';
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  like_count: number;
  downvote_count: number;
  comment_count: number;
  created_at: string;
  profile?: Profile;
  my_vote?: 'like' | 'downvote' | null;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  like_count: number;
  created_at: string;
  profile?: Profile;
  replies?: Comment[];
  my_like?: boolean;
}

export interface CommunityMessage {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  expires_at: string;
  profile?: Profile;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface GameRoom {
  id: string;
  owner_id: string;
  game_type: string;
  name: string;
  password: string | null;
  max_players: number;
  is_active: boolean;
  game_state: Record<string, unknown>;
  created_at: string;
  owner_profile?: Profile;
  member_count?: number;
}

export interface GameScore {
  id: string;
  user_id: string;
  game_type: string;
  score: number;
  achieved_at: string;
  profile?: Profile;
}

export interface CinemaRoom {
  id: string;
  owner_id: string;
  name: string;
  video_url: string;
  password: string | null;
  is_active: boolean;
  chat_messages: ChatMessage[];
  created_at: string;
  owner_profile?: Profile;
  seats?: CinemaSeat[];
}

export interface CinemaSeat {
  id: string;
  room_id: string;
  user_id: string;
  seat_number: number;
  profile?: Profile;
}

export interface ChatMessage {
  user_id: string;
  username: string;
  content: string;
  timestamp: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  content: string;
  from_user_id: string | null;
  ref_id: string | null;
  read: boolean;
  created_at: string;
  from_profile?: Profile;
}

export interface MusicStatus {
  id: string;
  track_title: string;
  artist: string;
  url: string;
  is_playing: boolean;
  updated_at: string;
}

export type OnlineStatus = 'online' | 'afk' | 'busy' | 'invisible';

export const PRONOUN_OPTIONS = ['He/Him', 'She/Her', 'They/Them', 'It/Its', 'He/They', 'She/They'];
export const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Agender', 'Prefer not to say'];
export const INTEREST_OPTIONS = ['Gaming', 'Music', 'Art', 'Movies', 'Coding', 'Anime', 'Sports', 'Reading', 'Cooking', 'Travel'];
