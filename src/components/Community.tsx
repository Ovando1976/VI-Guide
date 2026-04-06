import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Heart, Share2, MapPin, Plus, Image as ImageIcon, Send, X, Loader2, User as UserIcon } from 'lucide-react';
import { CommunityPost, IslandCode, UserProfile } from '../types';
import { subscribeToIslandPosts, createPost, likePost, addComment, subscribeToComments, PostComment } from '../lib/firestore/community';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

export default function Community({ 
  selectedIsland, 
  user 
}: { 
  selectedIsland: IslandCode;
  user: UserProfile | null;
}) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [estateSlug, setEstateSlug] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToIslandPosts(selectedIsland, setPosts);
    return () => unsubscribe();
  }, [selectedIsland]);

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim() || isUploading) return;

    setIsUploading(true);
    try {
      const imageUrls = await Promise.all(
        selectedImages.map(async (file) => {
          const storageRef = ref(storage, `community/${user.uid}/${Date.now()}-${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          return getDownloadURL(snapshot.ref);
        })
      );

      const success = await createPost({
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        content: newPostContent,
        islandCode: selectedIsland,
        estateSlug: estateSlug || undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
      });

      if (success) {
        setNewPostContent('');
        setEstateSlug('');
        setSelectedImages([]);
        setIsPosting(false);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
    }
  };

  return (
    <div className="pb-32 px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-turquoise/30" />
            <span className="micro-label">Territory Stories</span>
          </div>
          <h2 className="fluid-text font-serif italic text-ink">Island Feed</h2>
        </div>
        
        {user && (
          <button 
            onClick={() => setIsPosting(true)}
            className="group relative"
          >
            <div className="absolute inset-0 bg-turquoise/20 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative w-20 h-20 bg-ink text-turquoise rounded-[2rem] flex items-center justify-center shadow-2xl shadow-ink/20 active:scale-95 transition-all hover:bg-ocean hover:text-white">
              <Plus size={32} />
            </div>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 micro-label opacity-0 group-hover:opacity-100 transition-opacity">Share</span>
          </button>
        )}
      </div>

      {/* Posts List */}
      <div className="space-y-16 stagger-in">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} user={user} />
        ))}
        
        {posts.length === 0 && (
          <div className="py-40 text-center space-y-8 bg-white/40 backdrop-blur-3xl rounded-[4rem] border border-white/20 shadow-2xl">
            <div className="w-24 h-24 bg-sand rounded-full flex items-center justify-center mx-auto text-stone-200 shadow-inner">
              <MessageSquare size={48} />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-serif italic text-ink">Quiet in the Territory</p>
              <p className="micro-label">Be the first to share a story on this island</p>
            </div>
          </div>
        )}
      </div>

      {/* Post Modal */}
      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPosting(false)}
              className="absolute inset-0 bg-ink/40 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl bg-sand rounded-[3rem] shadow-2xl border border-white overflow-hidden"
            >
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-serif italic text-ink">Share a Story</h3>
                  <button onClick={() => setIsPosting(false)} className="text-stone-400 hover:text-ink transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What's happening in the territory?"
                    className="w-full h-48 bg-white/50 border border-stone-100 rounded-[2rem] p-8 outline-none focus:ring-4 focus:ring-turquoise/5 focus:border-turquoise transition-all font-serif italic text-lg resize-none"
                  />

                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                      <input 
                        type="text"
                        placeholder="Estate (optional)"
                        value={estateSlug}
                        onChange={(e) => setEstateSlug(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white/50 border border-stone-100 rounded-2xl outline-none focus:border-turquoise transition-all text-xs font-bold uppercase tracking-wider"
                      />
                    </div>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "w-14 h-14 bg-white border border-stone-100 rounded-2xl flex items-center justify-center transition-colors",
                        selectedImages.length > 0 ? "text-turquoise border-turquoise/30" : "text-stone-400 hover:text-turquoise"
                      )}
                    >
                      <ImageIcon size={20} />
                    </button>
                  </div>

                  {selectedImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedImages.map((file, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-stone-100">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          <button 
                            onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isUploading}
                  className="w-full py-6 bg-ink text-white rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-ink/20 hover:bg-ocean transition-all disabled:opacity-50 disabled:hover:bg-ink flex items-center justify-center gap-3"
                >
                  {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  {isUploading ? 'Uploading...' : 'Post to Feed'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PostCard({ post, user }: { post: CommunityPost; user: UserProfile | null }) {
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    await likePost(post.id!);
    setIsLiking(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/60 backdrop-blur-3xl rounded-[3.5rem] border border-white shadow-2xl shadow-stone-200/40 overflow-hidden group hover:shadow-turquoise/10 transition-all duration-500"
    >
      <div className="p-10 md:p-14 space-y-10">
        {/* User Info */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-turquoise/20 rounded-[1.8rem] blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-20 h-20 rounded-[1.8rem] overflow-hidden bg-stone-100 border-4 border-white shadow-2xl">
                {post.userPhoto ? (
                  <img src={post.userPhoto} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 bg-stone-50">
                    <UserIcon size={28} />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-serif italic text-3xl text-ink leading-none">{post.userName}</h4>
              <p className="micro-label text-stone-400">
                {formatDistanceToNow(post.createdAt)} ago
              </p>
            </div>
          </div>
          
          {post.estateSlug && (
            <div className="flex items-center gap-3 px-5 py-2.5 bg-turquoise/5 text-turquoise rounded-2xl border border-turquoise/10 shadow-sm">
              <MapPin size={14} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{post.estateSlug}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-8">
          <p className="text-2xl font-serif italic text-stone-600 leading-[1.4] text-balance">
            {post.content}
          </p>

          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-1 gap-6 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
              {post.images.map((img, idx) => (
                <img key={idx} src={img} alt="" className="w-full aspect-[16/10] object-cover hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-10 border-t border-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button 
              onClick={handleLike}
              disabled={!user || isLiking}
              className={cn(
                "flex items-center gap-4 transition-all group/btn",
                isLiking ? "text-rose-500" : "text-stone-400 hover:text-rose-500"
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center group-hover/btn:bg-rose-50 transition-all shadow-sm">
                <Heart size={20} fill={isLiking ? "currentColor" : "none"} />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.3em]">{post.likes}</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className={cn(
                "flex items-center gap-4 transition-all group/btn",
                showComments ? "text-turquoise" : "text-stone-400 hover:text-turquoise"
              )}
            >
              <div className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center group-hover/btn:bg-turquoise/10 transition-all shadow-sm">
                <MessageSquare size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.3em]">{post.commentsCount}</span>
            </button>
          </div>
          <button className="w-14 h-14 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 hover:text-ink hover:bg-white hover:shadow-md transition-all">
            <Share2 size={20} />
          </button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <PostComments postId={post.id!} user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function PostComments({ postId, user }: { postId: string; user: UserProfile | null }) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToComments(postId, setComments);
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async () => {
    if (!user || !newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await addComment({
      postId,
      userId: user.uid,
      userName: user.displayName,
      userPhoto: user.photoURL,
      content: newComment,
    });
    setNewComment('');
    setIsSubmitting(false);
  };

  return (
    <div className="pt-8 space-y-6">
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
              {comment.userPhoto && <img src={comment.userPhoto} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
            </div>
            <div className="flex-1 bg-sand/50 rounded-2xl p-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink">{comment.userName}</span>
                <span className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter">
                  {formatDistanceToNow(comment.createdAt)} ago
                </span>
              </div>
              <p className="text-sm font-serif italic text-stone-600">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      {user && (
        <div className="flex gap-4">
          <input 
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Add a comment..."
            className="flex-1 bg-white border border-stone-100 rounded-xl px-6 py-3 text-sm outline-none focus:border-turquoise transition-all"
          />
          <button 
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            className="w-12 h-12 bg-ink text-white rounded-xl flex items-center justify-center hover:bg-ocean transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
      )}
    </div>
  );
}
