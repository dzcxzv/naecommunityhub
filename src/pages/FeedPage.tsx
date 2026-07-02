import { useEffect, useState } from 'react';
import { Rss, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { PostCard } from '../components/PostCard';
import type { Post } from '../lib/types';

export function FeedPage({ onProfileClick }: { onProfileClick: (id: string) => void }) {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', profile.id);
      const followingIds = (follows || []).map(f => f.following_id);
      setFollowing(followingIds);

      if (followingIds.length === 0) { setLoading(false); return; }

      const { data } = await supabase
        .from('posts')
        .select('*, profile:profiles!user_id(username, avatar_url)')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);
      if (data) setPosts(data as unknown as Post[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel('feed-posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        (async () => {
          if (following.length === 0) return;
          const { data } = await supabase
            .from('posts')
            .select('*, profile:profiles!user_id(username, avatar_url)')
            .in('user_id', following)
            .order('created_at', { ascending: false })
            .limit(50);
          if (data) setPosts(data as unknown as Post[]);
        })();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, following]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2"><Rss className="w-6 h-6 gradient-text" /> Aktualności</h2>
      <p className="text-slate-400 mb-6">Posty od osób, które obserwujesz</p>

      {loading ? (
        <p className="text-center text-slate-400 py-12">Ładowanie...</p>
      ) : following.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">Nie obserwujesz nikogo</p>
          <p className="text-sm text-slate-500">Obserwuj osoby z zakładki Społeczność, aby widzieć ich posty tutaj</p>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-slate-400 py-12">Brak postów od obserwowanych osób.</p>
      ) : (
        <div className="space-y-4">
          {posts.map(p => <PostCard key={p.id} post={p} onProfileClick={onProfileClick} />)}
        </div>
      )}
    </div>
  );
}
