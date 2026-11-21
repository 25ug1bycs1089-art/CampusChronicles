import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  X,
  History,
  Send,
  Loader2,
  RotateCw
} from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function EditorDashboardPage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ pending: 0, published: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [previewArticle, setPreviewArticle] = useState(null);
  const [approveTargetArticle, setApproveTargetArticle] = useState(null);
  const [rejectModalArticle, setRejectModalArticle] = useState(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [rejectFeedbackError, setRejectFeedbackError] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'

  const [historyList, setHistoryList] = useState([]);

  const showNotice = (type, message) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4500);
  };

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/articles/pending');
      if (response.data?.success) {
        setQueue(response.data.articles || []);
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load editorial review queue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Check if current user is author of the article (conflict of interest for editors)
  const isOwnArticle = (article) => {
    if (!user || !article || !article.author) return false;
    const authorId = article.author._id || article.author;
    return authorId.toString() === user._id.toString();
  };

  // Trigger approve confirmation modal
  const handleApprove = (article) => {
    if (user?.role === 'editor' && isOwnArticle(article)) {
      showNotice('error', 'Conflict of interest: You cannot review or approve your own submission.');
      return;
    }
    setApproveTargetArticle(article);
  };

  // Confirm approve for publication
  const handleConfirmApprove = async () => {
    if (!approveTargetArticle) return;

    setIsSubmittingAction(true);
    try {
      const response = await apiClient.put(`/articles/${approveTargetArticle._id}/approve`);
      if (response.data?.success) {
        // Remove from local queue
        setQueue((prev) => prev.filter((a) => a._id !== approveTargetArticle._id));
        setStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          published: prev.published + 1,
        }));

        // Add to session decision history
        setHistoryList((prev) => [
          {
            id: `hist-${Date.now()}`,
            title: approveTargetArticle.title,
            author: approveTargetArticle.author?.name || 'Student Writer',
            category: approveTargetArticle.category,
            decision: 'Approved',
            date: 'Just now',
          },
          ...prev,
        ]);

        setPreviewArticle(null);
        showNotice('success', `Approved "${approveTargetArticle.title}"! The article is now live on the public campus feed.`);
        setApproveTargetArticle(null);
      }
    } catch (err) {
      showNotice('error', err.message || 'Failed to approve article.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const openRejectModal = (article) => {
    if (user?.role === 'editor' && isOwnArticle(article)) {
      showNotice('error', 'Conflict of interest: You cannot review or reject your own submission.');
      return;
    }
    setRejectModalArticle(article);
    setRejectionFeedback('');
    setRejectFeedbackError('');
  };

  // Reject article with mandatory feedback
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectionFeedback.trim()) {
      setRejectFeedbackError('Please provide constructive feedback explaining why this article requires revision.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const response = await apiClient.put(`/articles/${rejectModalArticle._id}/reject`, {
        feedback: rejectionFeedback.trim(),
      });

      if (response.data?.success) {
        // Remove from queue
        setQueue((prev) => prev.filter((a) => a._id !== rejectModalArticle._id));
        setStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          rejected: prev.rejected + 1,
        }));

        setHistoryList((prev) => [
          {
            id: `hist-${Date.now()}`,
            title: rejectModalArticle.title,
            author: rejectModalArticle.author?.name || 'Student Writer',
            category: rejectModalArticle.category,
            decision: 'Needs Revision',
            date: 'Just now',
          },
          ...prev,
        ]);

        showNotice(
          'success',
          `Returned "${rejectModalArticle.title}" to author with revision feedback.`
        );

        setRejectModalArticle(null);
        setPreviewArticle(null);
      }
    } catch (err) {
      showNotice('error', err.message || 'Failed to submit rejection feedback.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getWordCountAndReadTime = (content = '') => {
    const words = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes };
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Dashboard Header */}
      <DashboardHeader
        title="Editorial Board Review Desk"
        description="Review student submissions, evaluate drafts against quality standards, and provide constructive editorial feedback."
        activeRole={user?.role === 'admin' ? 'Admin' : 'Editor'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Status Notification Toast */}
        {actionNotice && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-150 shadow-xs ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatCard
            title="Pending Reviews"
            value={stats.pending ?? queue.length}
            subtitle="Articles in review pipeline"
            icon={Clock}
            color="amber"
          />
          <DashboardStatCard
            title="Total Published"
            value={stats.published}
            subtitle="Live articles on campus feed"
            icon={CheckCircle2}
            color="emerald"
          />
          <DashboardStatCard
            title="Revisions Requested"
            value={stats.rejected}
            subtitle="Constructive feedback loop"
            icon={XCircle}
            color="rose"
          />
          <DashboardStatCard
            title="Your Privileges"
            value={user?.role?.toUpperCase() || 'EDITOR'}
            subtitle={user?.role === 'admin' ? 'Superadmin review powers' : 'Peer editorial review'}
            icon={FileCheck}
            color="purple"
          />
        </div>

        {/* Review Queue Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header & Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Submissions Pipeline
                </h3>
                <p className="text-xs text-slate-500">
                  Peer editorial review queue for Campus Chronicles
                </p>
              </div>
              <button
                type="button"
                onClick={fetchQueue}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Refresh pending queue"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Queue ({queue.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Recent Decisions ({historyList.length})</span>
              </button>
            </div>
          </div>

          {/* Pending Queue Tab */}
          {activeTab === 'pending' && (
            <div>
              {isLoading ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  <p className="text-xs">Loading pending submissions from MongoDB Atlas...</p>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-rose-600 text-xs space-y-2">
                  <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
                  <p>{error}</p>
                  <button
                    onClick={fetchQueue}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                  >
                    Retry
                  </button>
                </div>
              ) : queue.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {queue.map((item) => {
                    const isSelf = user?.role === 'editor' && isOwnArticle(item);
                    const { words, minutes } = getWordCountAndReadTime(item.content);

                    return (
                      <div
                        key={item._id}
                        className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                            <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                            <span>•</span>
                            <span>Submitted {formatDate(item.createdAt)}</span>
                            <span>•</span>
                            <span>{minutes} min read ({words} words)</span>
                            {isSelf && (
                              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                Your Submission (Cannot Self-Review)
                              </span>
                            )}
                          </div>

                          <h4 className="text-base font-bold text-slate-900 leading-snug">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                            {item.excerpt}
                          </p>

                          <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                            <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                              {item.author?.name ? item.author.name[0] : 'S'}
                            </div>
                            <span className="font-medium text-slate-700">{item.author?.name || 'Student Writer'}</span>
                            <span className="text-slate-400">({item.author?.email})</span>
                          </div>
                        </div>

                        {/* Editorial Actions */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 self-end lg:self-center">
                          <button
                            type="button"
                            onClick={() => setPreviewArticle(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSelf || isSubmittingAction}
                            onClick={() => handleApprove(item)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs ${
                              isSelf
                                ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                                : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                            }`}
                            title={isSelf ? 'Editors cannot approve their own submissions' : 'Approve for publication'}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSelf || isSubmittingAction}
                            onClick={() => openRejectModal(item)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                              isSelf
                                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                                : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title={isSelf ? 'Editors cannot review their own submissions' : 'Reject with feedback'}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">Queue is completely clear!</p>
                  <p className="text-xs text-slate-500">All submitted student articles have been evaluated.</p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              {historyList.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {historyList.map((hist) => (
                    <div key={hist.id} className="p-4 sm:p-5 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{hist.title}</p>
                        <p className="text-slate-500">
                          Author: <span className="font-semibold text-slate-700">{hist.author}</span> • Category: {hist.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold ${
                            hist.decision === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {hist.decision}
                        </span>
                        <span className="text-slate-400">{hist.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <History className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium text-slate-700">No decisions made in this session yet.</p>
                  <p className="text-xs text-slate-400">Review pending submissions to see your editorial history here.</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Article Preview Modal */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded">
                  {previewArticle.category}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">
                  {getWordCountAndReadTime(previewArticle.content).minutes} min read
                </span>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 leading-tight">
                {previewArticle.title}
              </h3>
              <p className="text-slate-600 text-sm italic border-l-2 border-indigo-500 pl-3">
                "{previewArticle.excerpt}"
              </p>
            </div>

            {previewArticle.coverImage && (
              <img
                src={previewArticle.coverImage}
                alt={previewArticle.title}
                className="w-full max-h-72 object-cover rounded-2xl border border-slate-200"
              />
            )}

            {/* Formatted Article Body */}
            <div
              className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-800 pt-2"
              dangerouslySetInnerHTML={{ __html: previewArticle.content }}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2.5 text-xs text-slate-600">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                  {previewArticle.author?.name ? previewArticle.author.name[0] : 'S'}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{previewArticle.author?.name || 'Student Writer'}</p>
                  <p className="text-slate-400">{previewArticle.author?.email}</p>
                </div>
              </div>

              {/* Action Buttons inside Preview */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {user?.role === 'editor' && isOwnArticle(previewArticle) ? (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                    Your Submission (Cannot Self-Review)
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => openRejectModal(previewArticle)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 cursor-pointer transition-colors"
                    >
                      Reject & Feedback
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => handleApprove(previewArticle)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs transition-colors"
                    >
                      Approve & Publish
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject & Feedback Modal */}
      {rejectModalArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span>Editorial Rejection Feedback</span>
              </h3>
              <button
                onClick={() => setRejectModalArticle(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Help <strong>{rejectModalArticle.author?.name || 'the author'}</strong> improve their submission. Please provide specific, constructive revision notes (e.g. formatting improvements, citations, or technical clarity).
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Editorial Feedback Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectionFeedback}
                  onChange={(e) => {
                    setRejectionFeedback(e.target.value);
                    if (rejectFeedbackError) setRejectFeedbackError('');
                  }}
                  placeholder="e.g. 'The article is well written, but please add citations for the benchmarks in section 2 and replace low-resolution figures before resubmitting.'"
                  className={`w-full p-3 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-slate-800 ${
                    rejectFeedbackError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'
                  }`}
                  required
                />
                {rejectFeedbackError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{rejectFeedbackError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingAction}
                  onClick={() => setRejectModalArticle(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction || !rejectionFeedback.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAction ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Send Rejection Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Article Approval */}
      <ConfirmationModal
        isOpen={!!approveTargetArticle}
        onClose={() => setApproveTargetArticle(null)}
        onConfirm={handleConfirmApprove}
        title="Approve & Publish Article"
        description={`Approve "${approveTargetArticle?.title}" for immediate publication to the public campus feed?`}
        confirmText="Approve & Publish"
        cancelText="Cancel"
        variant="primary"
        isLoading={isSubmittingAction}
        icon={ThumbsUp}
      />

    </div>
  );
}
