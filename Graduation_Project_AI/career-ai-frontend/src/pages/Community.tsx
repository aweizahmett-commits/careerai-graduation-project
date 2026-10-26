import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Plus, X, Send, Pin, Trash2,
  Briefcase, GraduationCap, HelpCircle, Users,
  ChevronDown, ChevronUp, Search, TrendingUp, Clock,
  CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

const authHeader = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
};

type Category = 'all' | 'job_result' | 'job_help' | 'university' | 'general';
type SortOrder = 'latest' | 'popular';

interface CommentItem {
  id: number;
  author: string;
  author_initials: string;
  content: string;
  created_at: string;
}

interface Post {
  id: number;
  author: string;
  author_initials: string;
  category: Exclude<Category, 'all'>;
  title: string;
  content: string;
  created_at: string;
  pinned: boolean;
  likes_count: number;
  liked_by_me: boolean;
  is_mine: boolean;
  comments: CommentItem[];
  comments_count: number;
}

const categoryConfig = {
  job_result: {
    label: 'Job Result',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  job_help: {
    label: 'Job Help',
    icon: HelpCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  university: {
    label: 'University',
    icon: GraduationCap,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  general: {
    label: 'General',
    icon: Users,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

const avatarColors = [
  'from-indigo-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-600',
];

function avatarColor(name: string): string {
  const idx = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
}

const Community: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<number | null>(null);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general' as Exclude<Category, 'all'>,
  });
  const [postError, setPostError] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  const currentUserName = user
    ? `${user.first_name} ${user.last_name}`.trim() || user.username
    : 'You';

  const handleStaleSession = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const url = activeCategory === 'all'
        ? `${API_BASE}/community/posts/`
        : `${API_BASE}/community/posts/?category=${activeCategory}`;
      const res = await fetch(url, { headers: authHeader() });
      if (res.status === 401) { handleStaleSession(); return; }
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setPosts(data.results ?? data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, handleStaleSession]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const filtered = posts
    .filter(p =>
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (sortOrder === 'latest')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return b.likes_count - a.likes_count;
    });

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}/`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (res.status === 401) { handleStaleSession(); return; }
      if (!res.ok) {
        fetchPosts();
      }
    } catch {
      fetchPosts();
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}/like/`, {
        method: 'POST',
        headers: authHeader(),
      });
      if (res.status === 401) { handleStaleSession(); return; }
      if (!res.ok) return;
      const data = await res.json();
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes_count: data.likes_count, liked_by_me: data.liked } : p
      ));
    } catch {}
  };

  const handleComment = async (postId: number) => {
    const text = commentInputs[postId]?.trim();
    if (!text || submittingComment === postId) return;

    const tempId = -Date.now();
    const optimisticComment: CommentItem = {
      id: tempId,
      author: currentUserName,
      author_initials: initials(currentUserName || 'You'),
      content: text,
      created_at: new Date().toISOString(),
    };

    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, comments: [...p.comments, optimisticComment], comments_count: p.comments_count + 1 }
        : p
    ));
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setSubmittingComment(postId);

    try {
      const res = await fetch(`${API_BASE}/community/posts/${postId}/comments/`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ content: text }),
      });
      if (res.status === 401) { handleStaleSession(); return; }
      if (!res.ok) {
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, comments: p.comments.filter(c => c.id !== tempId), comments_count: p.comments_count - 1 }
            : p
        ));
        setCommentInputs(prev => ({ ...prev, [postId]: text }));
        return;
      }
      const updatedPost: Post = await res.json();
      setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));
    } catch {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, comments: p.comments.filter(c => c.id !== tempId), comments_count: p.comments_count - 1 }
          : p
      ));
      setCommentInputs(prev => ({ ...prev, [postId]: text }));
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim()) { setPostError('Please add a title.'); return; }
    if (!newPost.content.trim()) { setPostError('Please add some content.'); return; }
    setSubmittingPost(true);
    try {
      const res = await fetch(`${API_BASE}/community/posts/`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          category: newPost.category,
        }),
      });
      if (res.status === 401) {
        await handleStaleSession();
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setPostError(`Error ${res.status}: ${body.detail || body.error || 'Failed to create post.'}`);
        return;
      }
      const created: Post = await res.json();
      setPosts(prev => [created, ...prev]);
      setNewPost({ title: '', content: '', category: 'general' });
      setPostError('');
      setShowCreateModal(false);
    } catch (err: unknown) {
      setPostError(`Network error — is the backend server running? (${err instanceof Error ? err.message : err})`);
    } finally {
      setSubmittingPost(false);
    }
  };

  const toggleComments = (postId: number) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const categoryTabs: { key: Category; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'All Posts', icon: Users },
    { key: 'job_result', label: 'Job Results', icon: Briefcase },
    { key: 'job_help', label: 'Job Help', icon: HelpCircle },
    { key: 'university', label: 'University', icon: GraduationCap },
    { key: 'general', label: 'General', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 pt-6 pb-4"
      >
        <div className="bg-theme-card border border-theme rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-theme-primary flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-theme-accent-primary to-theme-accent-secondary flex items-center justify-center shadow-md">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Ostim Community
              </h1>
              <p className="text-theme-muted text-sm mt-1">
                Share job results, ask for help, discuss university life
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-theme-accent-primary hover:bg-theme-accent-secondary text-white font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts…"
              className="w-full bg-theme-card-hover border border-theme rounded-xl pl-9 pr-4 py-2.5 text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent-primary transition-colors"
            />
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto px-4 mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categoryTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                  active
                    ? 'community-active'
                    : 'bg-theme-card border-theme text-theme-secondary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-1 bg-theme-card border border-theme rounded-xl p-1 flex-shrink-0">
            <button
              onClick={() => setSortOrder('latest')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortOrder === 'latest' ? 'community-active rounded-lg' : 'text-theme-secondary'
              }`}
            >
              <Clock className="w-3 h-3" /> Latest
            </button>
            <button
              onClick={() => setSortOrder('popular')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortOrder === 'popular' ? 'community-active rounded-lg' : 'text-theme-secondary'
              }`}
            >
              <TrendingUp className="w-3 h-3" /> Popular
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto px-4 pb-10 space-y-4">
        {loading && (
          <div className="flex justify-center py-20 text-theme-muted">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-theme-muted">
            <Users className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm mt-1">Be the first to post in this category!</p>
          </div>
        )}

        <AnimatePresence>
          {filtered.map((post, idx) => {
            const cfg = categoryConfig[post.category];
            const CatIcon = cfg.icon;
            const liked = post.liked_by_me;
            const commentsOpen = expandedComments.has(post.id);

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`bg-theme-card border rounded-2xl shadow-sm overflow-hidden ${
                  post.pinned ? 'border-theme-accent-primary/40' : 'border-theme'
                }`}
              >
                {/* Pinned banner */}
                {post.pinned && (
                  <div className="flex items-center gap-1.5 px-5 py-2 bg-theme-accent-primary/10 border-b border-theme-accent-primary/20 text-xs font-medium text-theme-accent-primary">
                    <Pin className="w-3 h-3" /> Pinned post
                  </div>
                )}

                <div className="p-5">
                  {/* Author row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor(post.author)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-sm font-bold text-white">{post.author_initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-theme-primary">{post.author}</p>
                      <p className="text-xs text-theme-muted">{timeAgo(post.created_at)}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      <CatIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    {post.is_mine && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg text-theme-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <h2 className="text-base font-semibold text-theme-primary mb-1.5 leading-snug">{post.title}</h2>
                  <p className="text-sm text-theme-secondary leading-relaxed">{post.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-theme">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
                        liked ? 'text-rose-400' : 'text-theme-muted hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 transition-transform ${liked ? 'fill-rose-400 scale-110' : ''}`} />
                      {post.likes_count}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-theme-muted hover:text-theme-accent-primary transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {post.comments_count}
                      {commentsOpen
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {commentsOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-3 pt-4 border-t border-theme">
                          {post.comments.length === 0 && post.comments_count === 0 && (
                            <p className="text-xs text-theme-muted text-center py-2">No comments yet — be the first!</p>
                          )}
                          {post.comments.map(c => (
                            <div key={c.id} className="flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${avatarColor(c.author)} flex items-center justify-center flex-shrink-0`}>
                                <span className="text-xs font-bold text-white">{c.author_initials}</span>
                              </div>
                              <div className="flex-1 bg-theme-card-hover border border-theme rounded-xl px-3 py-2">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                  <span className="text-xs font-semibold text-theme-primary">{c.author}</span>
                                  <span className="text-[10px] text-theme-muted">{timeAgo(c.created_at)}</span>
                                </div>
                                <p className="text-xs text-theme-secondary">{c.content}</p>
                              </div>
                            </div>
                          ))}

                          {/* Comment input */}
                          <div className="flex items-center gap-2 pt-1">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${avatarColor(currentUserName)} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-xs font-bold text-white">{initials(currentUserName || 'You')}</span>
                            </div>
                            <div className="flex-1 flex items-center gap-2 bg-theme-card-hover border border-theme rounded-xl overflow-hidden pl-3">
                              <input
                                type="text"
                                value={commentInputs[post.id] ?? ''}
                                onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleComment(post.id); } }}
                                placeholder="Write a comment…"
                                className="flex-1 bg-transparent text-xs text-theme-primary placeholder-theme-muted focus:outline-none py-2"
                              />
                              <button
                                onClick={() => handleComment(post.id)}
                                className="p-2 text-theme-accent-primary hover:text-theme-accent-secondary transition-colors"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-theme-card border border-theme rounded-2xl shadow-2xl w-full max-w-lg"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
                <h2 className="text-lg font-bold text-theme-primary">Create a Post</h2>
                <button
                  onClick={() => { setShowCreateModal(false); setPostError(''); }}
                  className="p-2 rounded-lg text-theme-muted hover:text-theme-primary hover:bg-theme-card-hover transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(categoryConfig) as Exclude<Category, 'all'>[]).map(cat => {
                      const cfg = categoryConfig[cat];
                      const Icon = cfg.icon;
                      const selected = newPost.category === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setNewPost(p => ({ ...p, category: cat }))}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                            selected
                              ? 'community-active'
                              : 'border-theme bg-theme-card-hover text-theme-secondary'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-2">Title</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                    placeholder="What's your post about?"
                    maxLength={120}
                    className="w-full bg-theme-card-hover border border-theme rounded-xl px-4 py-3 text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent-primary transition-colors"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-2">Content</label>
                  <textarea
                    value={newPost.content}
                    onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                    placeholder="Share your experience, ask a question, or give advice…"
                    rows={5}
                    className="w-full bg-theme-card-hover border border-theme rounded-xl px-4 py-3 text-sm text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent-primary transition-colors resize-none"
                  />
                </div>

                {postError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {postError}
                  </div>
                )}

                <button
                  onClick={handleCreatePost}
                  disabled={submittingPost}
                  className="w-full bg-theme-accent-primary hover:bg-theme-accent-secondary text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submittingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submittingPost ? 'Posting…' : 'Post to Community'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
