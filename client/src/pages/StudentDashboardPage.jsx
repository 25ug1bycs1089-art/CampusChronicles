import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PenSquare,
  FileText,
  Clock,
  CheckCircle2,
  Eye,
  Trash2,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Loader2,
  RotateCw,
  Send,
  RotateCcw
} from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [counts, setCounts] = useState({ all: 0, draft: 0, pending: 0, published: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionToast, setActionToast] = useState(null);

  const showToast = (type, message) => {
    setActionToast({ type, message });
    setTimeout(() => setActionToast(null), 4500);
  };

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const response = await apiClient.get(`/articles/my${statusParam}`);
      if (response.data?.success) {
        setArticles(response.data.articles || []);
        if (response.data.counts) {
          setCounts(response.data.counts);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Confirmation Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    description: null,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'primary',
    icon: null,
    onConfirm: null,
  });
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

  const closeModal = () => {
    if (!isModalSubmitting) {
      setModalConfig((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // 1. Submit draft for editorial review with custom modal
  const requestSubmitForReview = (article) => {
    setModalConfig({
      isOpen: true,
      title: 'Submit for Review?',
      description: (
        <div className="space-y-2">
          <p>
            Are you ready to submit <strong className="text-slate-900">"{article.title}"</strong> to the editorial team?
          </p>
          <p className="text-xs text-slate-500">
            Your article will be sent directly to the student editorial board for review and publication. You will be able to track review progress on your dashboard, but editing will be locked while under review.
          </p>
        </div>
      ),
      confirmText: 'Submit for Review',
      variant: 'primary',
      icon: Send,
      onConfirm: async () => {
        setIsModalSubmitting(true);
        setActionLoadingId(article._id);
        try {
          const response = await apiClient.put(`/articles/${article._id}/submit`);
          if (response.data?.success) {
            setModalConfig((prev) => ({ ...prev, isOpen: false }));
            showToast('success', `"${article.title}" has been submitted for editorial review!`);
            await fetchArticles();
          }
        } catch (err) {
          showToast('error', err.message || 'Failed to submit article for review.');
        } finally {
          setIsModalSubmitting(false);
          setActionLoadingId(null);
        }
      },
    });
  };

  // 2. Withdraw pending submission back to draft with custom modal
  const requestWithdraw = (article) => {
    setModalConfig({
      isOpen: true,
      title: 'Withdraw Submission?',
      description: (
        <div className="space-y-2">
          <p>
            Withdraw <strong className="text-slate-900">"{article.title}"</strong> from the editorial review queue?
          </p>
          <p className="text-xs text-slate-500">
            The article will return to <strong>Draft</strong> status and can be edited and resubmitted later.
          </p>
        </div>
      ),
      confirmText: 'Withdraw Submission',
      variant: 'destructive',
      icon: RotateCcw,
      onConfirm: async () => {
        setIsModalSubmitting(true);
        setActionLoadingId(article._id);
        try {
          const response = await apiClient.put(`/articles/${article._id}/withdraw`);
          if (response.data?.success) {
            setModalConfig((prev) => ({ ...prev, isOpen: false }));
            showToast('success', `"${article.title}" withdrawn back to drafts.`);
            await fetchArticles();
          }
        } catch (err) {
          showToast('error', err.message || 'Failed to withdraw submission.');
        } finally {
          setIsModalSubmitting(false);
          setActionLoadingId(null);
        }
      },
    });
  };

  // 3. Delete article draft or rejected article with custom modal
  const requestDelete = (article) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Article?',
      description: (
        <p>
          Are you sure you want to permanently delete <strong className="text-slate-900">"{article.title}"</strong>? This action cannot be undone.
        </p>
      ),
      confirmText: 'Delete Permanently',
      variant: 'destructive',
      icon: Trash2,
      onConfirm: async () => {
        setIsModalSubmitting(true);
        setActionLoadingId(article._id);
        try {
          await apiClient.delete(`/articles/${article._id}`);
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          showToast('success', `"${article.title}" was deleted successfully.`);
          await fetchArticles();
        } catch (err) {
          showToast('error', err.message || 'Failed to delete article.');
        } finally {
          setIsModalSubmitting(false);
          setActionLoadingId(null);
        }
      },
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <DashboardHeader
        title="Student Writer Dashboard"
        description="Manage your drafts, submit completed work to the editorial board, and track review status."
        activeRole="Student"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Action Toast Notification */}
        {actionToast && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-150 shadow-xs ${
              actionToast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {actionToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionToast.message}</span>
          </div>
        )}

        {/* Welcome & Quick Action Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 border-2 border-indigo-400/40 text-white font-serif font-black text-2xl flex items-center justify-center uppercase shadow-sm shrink-0">
              {user?.name ? user.name[0] : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Welcome back, {user?.name || 'Student'}!
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {user?.role || 'Student'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                {counts.draft > 0
                  ? `You have ${counts.draft} draft ${counts.draft === 1 ? 'article' : 'articles'} in progress. Submit completed pieces for editorial review!`
                  : 'Start writing your next technical tutorial, academic paper review, or campus story.'}
              </p>
            </div>
          </div>

          <Link
            to="/write"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-indigo-50 transition-colors shadow-sm shrink-0 cursor-pointer"
          >
            <PenSquare className="w-4 h-4 text-indigo-600" />
            <span>Write New Article</span>
          </Link>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatCard
            title="Total Articles"
            value={counts.all}
            subtitle="All drafts & submissions"
            icon={FileText}
            color="indigo"
          />
          <DashboardStatCard
            title="Drafts"
            value={counts.draft}
            subtitle="In progress / unpublished"
            icon={PenSquare}
            color="sky"
          />
          <DashboardStatCard
            title="Pending Review"
            value={counts.pending}
            subtitle="Awaiting editorial decision"
            icon={Clock}
            color="amber"
          />
          <DashboardStatCard
            title="Published"
            value={counts.published}
            subtitle="Approved & live on campus feed"
            icon={CheckCircle2}
            color="emerald"
          />
        </div>

        {/* Submissions Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Tabs Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  My Articles & Submissions
                </h3>
                <p className="text-xs text-slate-500">
                  Track editorial workflow statuses and manage your writing portfolio
                </p>
              </div>
              <button
                type="button"
                onClick={fetchArticles}
                disabled={isLoading}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Refresh articles"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All', count: counts.all },
                { id: 'draft', label: 'Drafts', count: counts.draft },
                { id: 'pending', label: 'Pending Review', count: counts.pending },
                { id: 'published', label: 'Published', count: counts.published },
                { id: 'rejected', label: 'Needs Revision', count: counts.rejected },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === tab.id ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Submissions Table / List */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
              <p className="text-xs">Loading articles from database...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 text-xs space-y-2">
              <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
              <p>{error}</p>
              <button
                onClick={fetchArticles}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
              >
                Retry
              </button>
            </div>
          ) : articles.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {articles.map((sub) => (
                <div
                  key={sub._id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={sub.status} />
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-500">{sub.category}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">Updated {formatDate(sub.updatedAt)}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {sub.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl">
                      {sub.excerpt}
                    </p>

                    {/* Rejection Feedback Callout */}
                    {sub.status === 'rejected' && sub.rejectionFeedback && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start gap-2.5 max-w-2xl mt-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <strong className="font-bold text-rose-800 block">
                            Editorial Rejection Feedback:
                          </strong>
                          <p className="leading-relaxed text-slate-700">
                            {sub.rejectionFeedback}
                          </p>
                          <p className="text-[11px] text-rose-700/80 italic pt-1">
                            Click "Revise & Resubmit" below to address this feedback and resubmit for publication.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contextual Action Buttons Per Status */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
                    
                    {/* Status: DRAFT */}
                    {sub.status === 'draft' && (
                      <>
                        <button
                          type="button"
                          onClick={() => requestSubmitForReview(sub)}
                          disabled={actionLoadingId === sub._id || isModalSubmitting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                          title="Submit to editorial board for review"
                        >
                          {actionLoadingId === sub._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Submit for Review</span>
                        </button>

                        <Link
                          to={`/write?edit=${sub._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-2xs"
                        >
                          <PenSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => requestDelete(sub)}
                          disabled={actionLoadingId === sub._id || isModalSubmitting}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Status: PENDING REVIEW */}
                    {sub.status === 'pending' && (
                      <>
                        <Link
                          to={`/article/${sub._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-2xs"
                          title="Preview pending submission"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>Preview</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => requestWithdraw(sub)}
                          disabled={actionLoadingId === sub._id || isModalSubmitting}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50"
                          title="Withdraw back to draft"
                        >
                          {actionLoadingId === sub._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                          )}
                          <span>Withdraw</span>
                        </button>
                      </>
                    )}

                    {/* Status: REJECTED (Needs Revision) */}
                    {sub.status === 'rejected' && (
                      <>
                        <Link
                          to={`/write?edit=${sub._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-2xs"
                        >
                          <PenSquare className="w-3.5 h-3.5" />
                          <span>Revise & Resubmit</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => requestDelete(sub)}
                          disabled={actionLoadingId === sub._id || isModalSubmitting}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete rejected article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Status: PUBLISHED */}
                    {sub.status === 'published' && (
                      <Link
                        to={`/article/${sub._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>View Live</span>
                      </Link>
                    )}

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-700">
                {counts.all === 0
                  ? "You haven't created any articles yet."
                  : `No articles found with '${activeTab}' status.`}
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {counts.all === 0
                  ? 'Draft your thoughts, semester roadmaps, or research insights. All drafts remain private until submitted.'
                  : 'Check other tabs or write a new article.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/write"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors shadow-xs"
                >
                  <PenSquare className="w-3.5 h-3.5" />
                  <span>Write an article now</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Reusable Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText || 'Cancel'}
        variant={modalConfig.variant || 'primary'}
        isLoading={isModalSubmitting}
        icon={modalConfig.icon}
      />
    </div>
  );
}
