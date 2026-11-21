import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Save,
  Image as ImageIcon,
  CheckCircle2,
  ArrowLeft,
  Eye,
  Loader2,
  AlertCircle,
  Send,
  HelpCircle,
  Clock,
  Upload,
  X as XIcon,
} from 'lucide-react';
import TiptapEditor from '../components/editor/TiptapEditor';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { mockCategories } from '../data/mockData';
import apiClient from '../api/client';

export default function WritePage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState(mockCategories[0].name);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [articleStatus, setArticleStatus] = useState('draft');
  const [rejectionFeedback, setRejectionFeedback] = useState(null);

  const [statusNotification, setStatusNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isLoadingArticle, setIsLoadingArticle] = useState(Boolean(editId));
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const navigate = useNavigate();

  // Cover image upload
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const coverImageInputRef = useRef(null);

  // If editing an existing article, fetch its current draft data
  useEffect(() => {
    if (!editId) return;

    let isMounted = true;
    const fetchDraft = async () => {
      setIsLoadingArticle(true);
      try {
        const response = await apiClient.get(`/articles/${editId}`);
        if (isMounted && response.data?.success && response.data?.article) {
          const art = response.data.article;
          setTitle(art.title || '');
          setExcerpt(art.excerpt || '');
          setCategory(art.category || mockCategories[0].name);
          setCoverImageUrl(art.coverImage || '');
          setContent(art.content || '');
          setArticleStatus(art.status || 'draft');
          setRejectionFeedback(art.rejectionFeedback || null);
        }
      } catch (err) {
        if (isMounted) {
          setStatusNotification({
            type: 'error',
            message: err.message || 'Failed to load article draft',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingArticle(false);
        }
      }
    };

    fetchDraft();

    return () => {
      isMounted = false;
    };
  }, [editId]);

  // Calculate estimated reading time
  const wordCount = (title + ' ' + excerpt + ' ' + content)
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Validate form inputs
  const validateForm = () => {
    if (!title.trim()) {
      setStatusNotification({ type: 'error', message: 'Please provide an article title.' });
      return false;
    }
    if (!excerpt.trim()) {
      setStatusNotification({ type: 'error', message: 'Please provide a short excerpt (1-2 sentences).' });
      return false;
    }
    if (!content.trim() || content === '<p></p>') {
      setStatusNotification({ type: 'error', message: 'Article content cannot be empty.' });
      return false;
    }
    return true;
  };

  // Save Draft (without submitting)
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setStatusNotification(null);

    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        category,
        coverImage: coverImageUrl.trim(),
      };

      if (editId) {
        await apiClient.put(`/articles/${editId}`, payload);
        setStatusNotification({
          type: 'success',
          message: 'Draft changes saved successfully!',
        });
      } else {
        const response = await apiClient.post('/articles', payload);
        setStatusNotification({
          type: 'success',
          message: 'New draft saved successfully to your portfolio!',
        });
        if (response.data?.article?._id) {
          setTimeout(() => navigate(`/write?edit=${response.data.article._id}`), 1000);
          return;
        }
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 1400);
    } catch (err) {
      setStatusNotification({
        type: 'error',
        message: err.message || 'Failed to save draft. Please check your inputs.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open custom Submit / Resubmit Confirmation Modal after form validation
  const handleOpenSubmitModal = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setShowSubmitModal(true);
  };

  // Execute Save and Submit directly for editorial review
  const executeSubmitForReview = async () => {
    setIsSubmitting(true);
    setStatusNotification(null);

    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        category,
        coverImage: coverImageUrl.trim(),
      };

      let targetId = editId;

      if (editId) {
        // Save current changes first
        await apiClient.put(`/articles/${editId}`, payload);
      } else {
        // Create draft first
        const createRes = await apiClient.post('/articles', payload);
        targetId = createRes.data?.article?._id;
      }

      // Submit for review
      await apiClient.put(`/articles/${targetId}/submit`);

      setShowSubmitModal(false);
      setStatusNotification({
        type: 'success',
        message: articleStatus === 'rejected'
          ? 'Revised article resubmitted successfully to the editorial board! Redirecting to dashboard...'
          : 'Article submitted successfully to the editorial board! Redirecting to dashboard...',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setShowSubmitModal(false);
      setStatusNotification({
        type: 'error',
        message: err.message || 'Failed to submit article for review.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cover image file upload handler
  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = response.data?.url;
      if (url) setCoverImageUrl(url);
    } catch (err) {
      console.error('Cover image upload failed:', err);
    } finally {
      setIsCoverUploading(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = '';
    }
  };

  if (isLoadingArticle) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Loading draft from database...</p>
      </div>
    );
  }

  const isPending = articleStatus === 'pending';

  return (
    <div className="pb-24">
      {/* Top Action Header */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 z-30 py-3.5 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-2 hidden sm:inline">
              ~{wordCount} words • {readTimeMinutes} min read
            </span>

            {/* Preview Button */}
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview</span>
            </button>

            {/* Save Draft Button */}
            {!isPending && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                    <span>Save Draft</span>
                  </>
                )}
              </button>
            )}

            {/* Submit for Review Button */}
            {!isPending && (
              <button
                type="button"
                onClick={handleOpenSubmitModal}
                disabled={isSaving || isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{articleStatus === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Status Notification Toast */}
        {statusNotification && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-xs animate-in fade-in duration-200 shadow-xs ${
              statusNotification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <p className="font-semibold">{statusNotification.message}</p>
          </div>
        )}

        {/* Rejection Feedback Alert Banner */}
        {articleStatus === 'rejected' && rejectionFeedback && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Editorial Revision Requested</span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed pl-6">
              <strong>Editor's Notes:</strong> {rejectionFeedback}
            </p>
            <p className="text-[11px] text-rose-700 pl-6 italic">
              Please address these suggestions in the editor below. When ready, click "Resubmit for Review" in the top bar.
            </p>
          </div>
        )}

        {/* Pending Review Notice Banner */}
        {isPending && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 text-xs text-amber-900">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">This Article is Pending Review</p>
              <p className="leading-relaxed">
                Your piece has been submitted and is currently being evaluated by the student editorial board. If you need to make changes, withdraw the submission back to draft status from your Student Dashboard.
              </p>
            </div>
          </div>
        )}

        {/* General Editorial Workflow Guidelines */}
        {!isPending && articleStatus !== 'rejected' && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-slate-600">
            <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-800">
                Editorial Review Workflow
              </p>
              <p className="leading-relaxed">
                Save drafts as work-in-progress. When complete, click <strong>"Submit for Review"</strong> to send your piece to the campus editorial board for double-blind peer review before publication.
              </p>
            </div>
          </div>
        )}

        {/* Article Editor Form */}
        <form className="space-y-6">
          {/* Title Field */}
          <div>
            <input
              type="text"
              value={title}
              disabled={isPending}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article Title..."
              className="w-full text-3xl sm:text-5xl font-serif font-black text-slate-900 placeholder-slate-300 border-none outline-none focus:ring-0 bg-transparent px-0 disabled:opacity-60"
              required
            />
          </div>

          {/* Category & Excerpt Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                disabled={isPending}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
              >
                {mockCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Excerpt Input */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Excerpt / Summary
              </label>
              <input
                type="text"
                value={excerpt}
                disabled={isPending}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A compelling 1-2 sentence overview of your piece..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                required
              />
            </div>
          </div>

          {/* Cover Image Upload Field */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Cover Image (Optional)
            </label>
            {/* Hidden file input */}
            <input
              type="file"
              ref={coverImageInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handleCoverImageUpload}
            />
            <div className="flex items-center gap-2">
              {/* Upload button */}
              <button
                type="button"
                onClick={() => !isCoverUploading && !isPending && coverImageInputRef.current?.click()}
                disabled={isCoverUploading || isPending}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                {isCoverUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isCoverUploading ? 'Uploading...' : 'Upload Image'}</span>
              </button>

              {/* Sample image shortcut */}
              {!isPending && (
                <button
                  type="button"
                  onClick={() =>
                    setCoverImageUrl(
                      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80'
                    )
                  }
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors shrink-0 cursor-pointer"
                >
                  Sample Image
                </button>
              )}

              {/* Show current URL truncated, with a remove button */}
              {coverImageUrl && (
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-500 truncate">{coverImageUrl}</span>
                  {!isPending && (
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('')}
                      className="shrink-0 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Live Preview of Cover Image */}
            {coverImageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100 relative">
                <img
                  src={coverImageUrl}
                  alt="Cover Preview"
                  className="w-full h-56 object-cover"
                  onError={() => {}}
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-white">
                  Cover Preview
                </span>
              </div>
            )}
          </div>

          {/* Tiptap Rich-Text Editor */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Article Content & Body
            </label>
            <TiptapEditor
              content={content}
              onChange={setContent}
            />
          </div>

        </form>

      </div>

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-10 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                Preview ({category})
              </span>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900">
              {title || 'Untitled Article'}
            </h2>

            <p className="text-base text-slate-600 font-sans italic border-l-2 border-indigo-500 pl-3">
              {excerpt || 'No excerpt provided.'}
            </p>

            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt="Preview Cover"
                className="w-full h-64 object-cover rounded-2xl border border-slate-200"
              />
            )}

            <div
              className="prose prose-slate max-w-none text-slate-800 font-serif leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content || '<p>No content written yet.</p>' }}
            />
          </div>
        </div>
      )}

      {/* Submit / Resubmit Confirmation Modal */}
      <ConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => !isSubmitting && setShowSubmitModal(false)}
        onConfirm={executeSubmitForReview}
        title={articleStatus === 'rejected' ? 'Resubmit for Review?' : 'Submit for Review?'}
        description={
          <div className="space-y-2">
            <p>
              {articleStatus === 'rejected'
                ? `Ready to resubmit "${title}" to the editorial board?`
                : `Ready to submit "${title}" to the student editorial board?`}
            </p>
            <p className="text-xs text-slate-500">
              {articleStatus === 'rejected'
                ? 'Your revised changes will be saved and your article will re-enter the review queue for editorial approval. Previous rejection notes will be cleared.'
                : 'Your article will be sent directly to the student editorial board for review and publication. You will be able to track its progress from your dashboard.'}
            </p>
          </div>
        }
        confirmText={articleStatus === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
        cancelText="Cancel"
        variant="primary"
        isLoading={isSubmitting}
        icon={Send}
      />

    </div>
  );
}
