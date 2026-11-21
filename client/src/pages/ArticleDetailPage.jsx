import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Clock,
  Heart,
  Share2,
  Bookmark,
  MessageSquare,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  Trash2,
  LogIn
} from 'lucide-react';
import ArticleCard from '../components/common/ArticleCard';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Comments state
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState(null);

  // Delete comment confirmation modal state
  const [deleteCommentId, setDeleteCommentId] = useState(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  // Social actions
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(24);
  const [isSaved, setIsSaved] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const showCommentToast = (type, message) => {
    setCommentFeedback({ type, message });
    setTimeout(() => setCommentFeedback(null), 4000);
  };

  // 1. Fetch Article and Related Articles
  const fetchArticle = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await apiClient.get(`/articles/${id}`);
      if (response.data?.success && response.data?.article) {
        setArticle(response.data.article);
        setRelatedArticles(response.data.relatedArticles || []);
        setLikeCount(response.data.article.views || 24);
      }
    } catch (err) {
      setLoadError(err.message || 'Article not found or access denied.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // 2. Fetch Comments for this Article
  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    try {
      const response = await apiClient.get(`/articles/${id}/comments`);
      if (response.data?.success) {
        setComments(response.data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArticle();
    fetchComments();
  }, [fetchArticle, fetchComments]);

  // 3. Post a new comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!user) {
      showCommentToast('error', 'Please log in to post a comment.');
      return;
    }

    setIsSubmittingComment(true);
    try {
      const response = await apiClient.post(`/articles/${id}/comments`, {
        content: commentText.trim(),
      });

      if (response.data?.success && response.data?.comment) {
        setComments((prev) => [response.data.comment, ...prev]);
        setCommentText('');
        showCommentToast('success', 'Your comment has been published.');
      }
    } catch (err) {
      showCommentToast('error', err.message || 'Failed to post comment.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 4. Delete a comment
  const executeDeleteComment = async () => {
    if (!deleteCommentId) return;

    setIsDeletingComment(true);
    try {
      const response = await apiClient.delete(`/comments/${deleteCommentId}`);
      if (response.data?.success) {
        setComments((prev) => prev.filter((c) => c._id !== deleteCommentId));
        setDeleteCommentId(null);
        showCommentToast('success', 'Comment deleted successfully.');
      }
    } catch (err) {
      showCommentToast('error', err.message || 'Failed to delete comment.');
      setDeleteCommentId(null);
    } finally {
      setIsDeletingComment(false);
    }
  };

  const handleLike = () => {
    if (isLiked) {
      setLikeCount((prev) => Math.max(0, prev - 1));
      setIsLiked(false);
    } else {
      setLikeCount((prev) => prev + 1);
      setIsLiked(true);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Loading campus story...</p>
      </div>
    );
  }

  if (loadError || !article) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-serif font-black text-slate-900">
          Story Unavailable
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {loadError || 'This article cannot be accessed or does not exist.'}
        </p>
        <div className="pt-2">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-indigo-600 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Browse All Published Stories</span>
          </Link>
        </div>
      </div>
    );
  }

  const wordCount = (article.content || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
  const publishedDate = formatDate(article.publishedAt || article.createdAt);
  const authorName = article.author?.name || 'Student Writer';
  const authorInitial = authorName ? authorName[0] : 'S';

  return (
    <article className="pb-24">
      {/* Top Breadcrumb & Return Nav */}
      <div className="bg-white border-b border-slate-200/80 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs text-slate-500">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to explore</span>
          </Link>
          <div className="flex items-center gap-2">
            <span>Category:</span>
            <Link
              to={`/explore?category=${encodeURIComponent(article.category)}`}
              className="text-indigo-600 font-semibold hover:underline"
            >
              {article.category}
            </Link>
          </div>
        </div>
      </div>

      {/* Unpublished Status Notice Banners for Authorized Editors/Authors */}
      {article.status === 'draft' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Draft Preview:</strong> This article is an unpublished draft and is only visible to you.
              </span>
            </div>
            <Link
              to={`/write?edit=${article._id || article.id}`}
              className="font-bold underline text-amber-800 hover:text-amber-950"
            >
              Edit Draft
            </Link>
          </div>
        </div>
      )}

      {article.status === 'pending' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Pending Review:</strong> This article is currently awaiting decision by the student editorial board.
              </span>
            </div>
            <Link
              to="/dashboard"
              className="font-bold underline text-amber-800 hover:text-amber-950"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      {article.status === 'rejected' && (
        <div className="bg-rose-50 border-b border-rose-200 py-3.5 px-4">
          <div className="max-w-4xl mx-auto space-y-1 text-xs text-rose-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Revision Requested by Editorial Board</span>
              </div>
              <Link
                to={`/write?edit=${article._id || article.id}`}
                className="font-bold underline text-rose-800 hover:text-rose-950"
              >
                Revise & Resubmit
              </Link>
            </div>
            {article.rejectionFeedback && (
              <p className="text-slate-700 pl-6">
                <strong>Feedback:</strong> {article.rejectionFeedback}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 space-y-8">
        
        {/* Article Header */}
        <header className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
              {article.category}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readTime}
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.2]">
            {article.title}
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-sans">
            {article.excerpt}
          </p>

          {/* Author Byline & Metadata Card */}
          <div className="flex items-center justify-between py-4 border-y border-slate-200">
            <div className="flex items-center gap-3.5">
              {article.author?.profilePicture ? (
                <img
                  src={article.author.profilePicture}
                  alt={authorName}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-serif font-bold text-lg flex items-center justify-center uppercase shadow-2xs shrink-0">
                  {authorInitial}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {authorName}
                </p>
                <p className="text-xs text-slate-500 leading-normal">
                  {article.author?.department || 'Campus Contributor'} • {article.author?.role?.toUpperCase() || 'STUDENT'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {article.status === 'draft' ? 'Draft in progress' : `Published on ${publishedDate}`}
                </p>
              </div>
            </div>

            {/* Interaction Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLike}
                className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  isLiked
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Clap / Like article"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{likeCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSaved(!isSaved)}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Bookmark article"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Share notification toast */}
          {showShareToast && (
            <div className="bg-slate-900 text-white text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 animate-in fade-in duration-200 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Article link copied to clipboard!</span>
            </div>
          )}
        </header>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-100">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full max-h-[460px] object-cover"
            />
          </div>
        )}

        {/* Formatted Article Body with Rich Prose Styling */}
        <div
          className="prose prose-slate prose-lg max-w-none text-slate-800 leading-relaxed space-y-6 pt-4 font-serif text-[18px]"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Author Bio Box */}
        <div className="bg-slate-100/70 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 mt-12">
          {article.author?.profilePicture ? (
            <img
              src={article.author.profilePicture}
              alt={authorName}
              className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-900 text-white font-serif font-black text-xl flex items-center justify-center uppercase shrink-0">
              {authorInitial}
            </div>
          )}
          <div className="space-y-1 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              About the Author
            </span>
            <h4 className="text-base font-bold text-slate-900">
              {authorName}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {article.author?.bio || `${authorName} is a campus contributor writing on Campus Chronicles.`}
            </p>
          </div>
        </div>

        {/* Comments Section */}
        <section className="pt-10 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Peer Discussion ({comments.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Campus-moderated discussion</span>
          </div>

          {/* Feedback notification toast */}
          {commentFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
                commentFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {commentFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{commentFeedback.message}</span>
            </div>
          )}

          {/* Comment Form or Login Prompt */}
          {user ? (
            <form
              onSubmit={handleAddComment}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span>Commenting as</span>
                <strong className="text-slate-900">{user.name}</strong>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700">
                  {user.role}
                </span>
              </div>
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="What are your thoughts on this piece? Share your campus insights..."
                maxLength={1000}
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 placeholder-slate-400"
                required
              />
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  {1000 - commentText.length} characters remaining
                </p>
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentText.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-indigo-600 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post Comment</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
              <p className="text-sm font-bold text-slate-800">Join the discussion</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Sign in with your verified campus credentials to participate in peer review discussions and comment on student articles.
              </p>
              <div className="pt-1">
                <Link
                  to="/login"
                  state={{ from: location }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log in to Comment</span>
                </Link>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-3 pt-2">
            {isLoadingComments ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
                <p className="text-xs">Loading peer discussion...</p>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comm) => {
                const commAuthorName = comm.author?.name || 'Fellow Student';
                const commAuthorRole = comm.author?.role || 'student';
                const commAuthorInitial = commAuthorName ? commAuthorName[0] : 'S';
                const isAuthorOrAdmin =
                  user &&
                  (comm.author?._id === user._id ||
                    comm.author === user._id ||
                    user.role === 'admin');

                return (
                  <div
                    key={comm._id}
                    className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {comm.author?.profilePicture ? (
                          <img
                            src={comm.author.profilePicture}
                            alt={commAuthorName}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                            {commAuthorInitial}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-slate-900 mr-2">
                            {commAuthorName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                            {commAuthorRole}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {formatDate(comm.createdAt)}
                        </span>
                        {isAuthorOrAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteCommentId(comm._id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-9.5">
                      {comm.content}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-1 bg-white rounded-xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-700">No comments on this article yet</p>
                <p className="text-[11px] text-slate-400">Be the first to share your thoughts or ask a question.</p>
              </div>
            )}
          </div>
        </section>

        {/* Related Articles in Same Category */}
        {relatedArticles.length > 0 && (
          <section className="pt-12 border-t border-slate-200 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              More in {article.category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <ArticleCard key={rel._id || rel.id} article={rel} variant="grid" />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* Delete Comment Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteCommentId)}
        onClose={() => !isDeletingComment && setDeleteCommentId(null)}
        onConfirm={executeDeleteComment}
        title="Delete Comment?"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete Comment"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeletingComment}
        icon={Trash2}
      />
    </article>
  );
}
