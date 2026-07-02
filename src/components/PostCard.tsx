import { useState } from 'react';
import { Heart, HeartCrack, MessageCircle, Send, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Avatar } from './Avatar';
import { timeAgo } from '../lib/utils';
import type { Post, Comment, Profile } from '../lib/types';

export function PostCard({ post, onProfileClick }: { post: Post; onProfileClick: (id: string) => void }) {
  const { profile } = useAuth();
  const [likes, setLikes] = useState(post.like_count);
  const [downvotes, setDownvotes] = useState(post.downvote_count);
  const [myVote, setMyVote] = useState(post.my_vote || null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.comment_count);

  const vote = async (type: 'like' | 'downvote') => {
    if (!profile) return;
    const newVote = myVote === type ? null : type;
    setMyVote(newVote);
    if (type === 'like') setLikes(l => l + (newVote === 'like' ? 1 : myVote === 'like' ? -1 : 0));
    if (type === 'downvote') setDownvotes(d => d + (newVote === 'downvote' ? 1 : myVote === 'downvote' ? -1 : 0));

    if (newVote === null) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', profile.id);
    } else {
      await supabase.from('post_likes').upsert({ post_id: post.id, user_id: profile.id, type: newVote }, { onConflict: 'post_id,user_id' });
      if (newVote === 'like' && post.user_id !== profile.id) {
        await supabase.from('notifications').insert({ user_id: post.user_id, type: 'like', content: `${profile.username} polubił Twój post`, from_user_id: profile.id, ref_id: post.id });
      }
    }
    await supabase.rpc('update_post_counts', { p_id: post.id }).then(() => {});
    // Manual count update fallback
    const [{ count: lc }, { count: dc }] = await Promise.all([
      supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id).eq('type', 'like'),
      supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id).eq('type', 'downvote'),
    ]);
    await supabase.from('posts').update({ like_count: lc || 0, downvote_count: dc || 0 }).eq('id', post.id);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles!user_id(username, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    if (data) {
      const topLevel = data.filter(c => !c.parent_id);
      const replies = data.filter(c => c.parent_id);
      const structured = topLevel.map(c => ({ ...c, profile: c.profile as unknown as Profile, replies: replies.filter(r => r.parent_id === c.id).map(r => ({ ...r, profile: r.profile as unknown as Profile })) }));
      setComments(structured as unknown as Comment[]);
    }
  };

  const addComment = async (parentId?: string) => {
    if (!profile || !commentText.trim()) return;
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: profile.id, parent_id: parentId || null, content: commentText.trim() })
      .select('*, profile:profiles!user_id(username, avatar_url)')
      .single();
    if (data) {
      setCommentCount(c => c + 1);
      await supabase.from('posts').update({ comment_count: commentCount + 1 }).eq('id', post.id);
      setCommentText('');
      await loadComments();
      if (post.user_id !== profile.id) {
        await supabase.from('notifications').insert({ user_id: post.user_id, type: 'comment', content: `${profile.username} skomentował Twój post`, from_user_id: profile.id, ref_id: post.id });
      }
    }
  };

  const likeComment = async (commentId: string) => {
    if (!profile) return;
    await supabase.from('comment_likes').upsert({ comment_id: commentId, user_id: profile.id }, { onConflict: 'comment_id,user_id' });
    await loadComments();
  };

  const deletePost = async () => {
    if (!profile || profile.id !== post.user_id) return;
    await supabase.from('posts').delete().eq('id', post.id);
  };

  return (
    <div className="p-4 rounded-2xl glass-dark border border-white/10 animate-fade-in">
      <div className="flex items-start gap-3">
        <Avatar username={post.profile?.username || ''} avatarUrl={post.profile?.avatar_url} size="md" onClick={() => onProfileClick(post.user_id)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={() => onProfileClick(post.user_id)} className="font-medium text-slate-200 hover:text-pink-400">{post.profile?.username}</button>
            <span className="text-xs text-slate-500">{timeAgo(post.created_at)}</span>
            {profile?.id === post.user_id && (
              <button onClick={deletePost} className="ml-auto p-1 text-slate-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
          <p className="mt-1 text-slate-300 whitespace-pre-wrap break-words">{post.content}</p>
          {post.image_url && <img src={post.image_url} alt="" className="mt-3 rounded-xl max-h-96 object-cover" />}

          <div className="mt-3 flex items-center gap-4">
            <button onClick={() => vote('like')} className={`flex items-center gap-1.5 text-sm transition-colors ${myVote === 'like' ? 'text-rose-400' : 'text-slate-400 hover:text-rose-400'}`}>
              <Heart className={`w-4 h-4 ${myVote === 'like' ? 'fill-current' : ''}`} /> {likes}
            </button>
            <button onClick={() => vote('downvote')} className={`flex items-center gap-1.5 text-sm transition-colors ${myVote === 'downvote' ? 'text-purple-400' : 'text-slate-400 hover:text-purple-400'}`}>
              <HeartCrack className={`w-4 h-4 ${myVote === 'downvote' ? 'fill-current' : ''}`} /> {downvotes}
            </button>
            <button onClick={() => { setShowComments(s => !s); if (!showComments) loadComments(); }} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-pink-400 transition-colors">
              <MessageCircle className="w-4 h-4" /> {commentCount}
            </button>
          </div>

          {showComments && (
            <div className="mt-4 space-y-3 animate-fade-in">
              <div className="flex gap-2">
                <Avatar username={profile?.username || ''} avatarUrl={profile?.avatar_url} size="sm" />
                <div className="flex-1 flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()}
                    placeholder="Napisz komentarz..."
                    className="flex-1 bg-[#0a0a14] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-400"
                  />
                  <button onClick={() => addComment()} className="p-2 rounded-lg gradient-bg text-white gradient-bg-hover"><Send className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {comments.map(c => (
                <div key={c.id} className="space-y-2">
                  <div className="flex gap-2">
                    <Avatar username={c.profile?.username || ''} avatarUrl={c.profile?.avatar_url} size="sm" onClick={() => onProfileClick(c.user_id)} />
                    <div className="flex-1">
                      <div className="bg-[#0a0a14] rounded-lg px-3 py-2">
                        <button onClick={() => onProfileClick(c.user_id)} className="text-xs font-medium text-slate-300 hover:text-pink-400">{c.profile?.username}</button>
                        <p className="text-sm text-slate-300">{c.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-1">
                        <button onClick={() => likeComment(c.id)} className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1"><Heart className="w-3 h-3" /> {c.like_count}</button>
                        <button onClick={() => { setCommentText(`@${c.profile?.username} `); }} className="text-xs text-slate-500 hover:text-pink-400">Odpowiedz</button>
                        <span className="text-xs text-slate-500">{timeAgo(c.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {c.replies?.map(r => (
                    <div key={r.id} className="flex gap-2 ml-6">
                      <Avatar username={r.profile?.username || ''} avatarUrl={r.profile?.avatar_url} size="sm" onClick={() => onProfileClick(r.user_id)} />
                      <div className="flex-1">
                        <div className="bg-[#0a0a14]/60 rounded-lg px-3 py-2">
                          <button onClick={() => onProfileClick(r.user_id)} className="text-xs font-medium text-slate-300 hover:text-pink-400">{r.profile?.username}</button>
                          <p className="text-sm text-slate-300">{r.content}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1 ml-1">
                          <button className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1"><Heart className="w-3 h-3" /> {r.like_count}</button>
                          <span className="text-xs text-slate-500">{timeAgo(r.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
