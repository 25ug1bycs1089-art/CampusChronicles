import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Clock,
  Plus,
  Trash2,
  FolderPlus,
  Tag,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  RotateCw,
  ExternalLink,
  Send
} from 'lucide-react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import ConfirmationModal from '../components/common/ConfirmationModal';
import apiClient from '../api/client';
import { mockUsersList } from '../data/mockData';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState(mockUsersList);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'users' | 'categories'

  // Pending Reviews & Stats from live backend
  const [pendingQueue, setPendingQueue] = useState([]);
  const [articleStats, setArticleStats] = useState({ pending: 0, published: 0, rejected: 0, total: 0 });
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [pendingError, setPendingError] = useState(null);

  // Review Actions State
  const [previewArticle, setPreviewArticle] = useState(null);
  const [approveTargetArticle, setApproveTargetArticle] = useState(null);
  const [rejectModalArticle, setRejectModalArticle] = useState(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [rejectFeedbackError, setRejectFeedbackError] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Delete Category Confirmation Modal State
  const [deleteTargetCategory, setDeleteTargetCategory] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // User search query
  const [userSearch, setUserSearch] = useState('');

  // Add Category Modal State
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDescription, setNewCatDescription] = useState('');
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch pending articles and global article statistics
  const fetchPendingQueue = useCallback(async () => {
    setIsLoadingPending(true);
    setPendingError(null);
    try {
      const response = await apiClient.get('/articles/pending');
      if (response.data?.success) {
        setPendingQueue(response.data.articles || []);
        if (response.data.stats) {
          setArticleStats(response.data.stats);
        }
      }
    } catch (err) {
      setPendingError(err.message || 'Failed to load pending submissions from server');
    } finally {
      setIsLoadingPending(false);
    }
  }, []);

  // Fetch live categories from backend
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const response = await apiClient.get('/categories');
      if (response.data?.success) {
        setCategories(response.data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingQueue();
    fetchCategories();
  }, [fetchPendingQueue, fetchCategories]);

  // Approve article for publication (called from ConfirmationModal)
  const handleConfirmApprove = async () => {
    if (!approveTargetArticle) return;

    setIsSubmittingAction(true);
    try {
      const response = await apiClient.put(`/articles/${approveTargetArticle._id}/approve`);
      if (response.data?.success) {
        setPendingQueue((prev) => prev.filter((a) => a._id !== approveTargetArticle._id));
        setArticleStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          published: prev.published + 1,
        }));
        setPreviewArticle(null);
        showNotification('success', `Approved "${approveTargetArticle.title}"! The article is now live.`);
        setApproveTargetArticle(null);
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to approve article.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const openRejectModal = (article) => {
    setRejectModalArticle(article);
    setRejectionFeedback('');
    setRejectFeedbackError('');
  };

  // Reject article with required feedback
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
        setPendingQueue((prev) => prev.filter((a) => a._id !== rejectModalArticle._id));
        setArticleStats((prev) => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          rejected: prev.rejected + 1,
        }));
        showNotification(
          'success',
          `Returned "${rejectModalArticle.title}" to author with revision feedback.`
        );
        setRejectModalArticle(null);
        setPreviewArticle(null);
      }
    } catch (err) {
      showNotification('error', err.message || 'Failed to reject article.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    showNotification('success', `User role updated to ${newRole}`);
  };

  // Add new Category through live backend API
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const response = await apiClient.post('/categories', {
        name: newCatName.trim(),
        description: newCatDescription.trim() || undefined,
      });

      if (response.data?.success) {
        setShowAddCatModal(false);
        setNewCatName('');
        setNewCatDescription('');
        showNotification('success', `Category "${response.data.category.name}" added successfully.`);
        fetchCategories();
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message || 'Failed to create category.');
    }
  };

  // Delete Category through live backend API (called from ConfirmationModal)
  const handleConfirmDeleteCategory = async () => {
    if (!deleteTargetCategory) return;
    setIsDeletingCategory(true);
    try {
      const catId = deleteTargetCategory._id || deleteTargetCategory.id;
      const response = await apiClient.delete(`/categories/${catId}`);
      if (response.data?.success) {
        setCategories((prev) => prev.filter((c) => (c._id || c.id) !== catId));
        showNotification('success', `Category "${deleteTargetCategory.name}" removed successfully.`);
        setDeleteTargetCategory(null);
      }
    } catch (err) {
      showNotification('error', err.response?.data?.message || err.message || 'Failed to delete category.');
    } finally {
      setIsDeletingCategory(false);
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

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24">
      {/* Dashboard Header */}
      <DashboardHeader
        title="Campus Administration Panel"
        description="Platform oversight, user role governance, category hierarchy, and institutional publishing policies."
        activeRole="Admin"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Notification Toast */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-150 shadow-xs ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Global Platform Statistics (Live from MongoDB Atlas) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardStatCard
            title="Pending Reviews"
            value={articleStats.pending ?? pendingQueue.length}
            subtitle="In editorial queue"
            icon={Clock}
            color="amber"
          />
          <DashboardStatCard
            title="Total Articles"
            value={articleStats.total || (articleStats.pending + articleStats.published + articleStats.rejected)}
            subtitle="All time submissions"
            icon={FileText}
            color="indigo"
          />
          <DashboardStatCard
            title="Published Articles"
            value={articleStats.published}
            subtitle="Live on public feed"
            icon={CheckCircle2}
            color="emerald"
          />
          <DashboardStatCard
            title="Total Users"
            value={users.length}
            subtitle="Verified campus accounts"
            icon={Users}
            color="sky"
          />
        </div>

        {/* Management Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'pending'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Pending Reviews ({pendingQueue.length})</span>
                {pendingQueue.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>User Management ({users.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                  activeTab === 'categories'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Categories ({categories.length})</span>
              </button>
            </div>

            {/* Contextual Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {activeTab === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchPendingQueue}
                    disabled={isLoadingPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                    title="Refresh pending submissions from database"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoadingPending ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <Link
                    to="/editor"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors border border-indigo-200"
                  >
                    <span>Editor Desk</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              {activeTab === 'categories' && (
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              )}

              {activeTab === 'users' && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pending Reviews Tab */}
          {activeTab === 'pending' && (
            <div>
              {isLoadingPending ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  <p className="text-xs">Loading pending submissions from MongoDB Atlas...</p>
                </div>
              ) : pendingError ? (
                <div className="p-8 text-center text-rose-600 text-xs space-y-2">
                  <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
                  <p>{pendingError}</p>
                  <button
                    onClick={fetchPendingQueue}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                  >
                    Retry
                  </button>
                </div>
              ) : pendingQueue.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {pendingQueue.map((item) => {
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
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              {item.status}
                            </span>
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

                        {/* Action Buttons */}
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
                            disabled={isSubmittingAction}
                            onClick={() => setApproveTargetArticle(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs cursor-pointer"
                            title="Approve for publication"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmittingAction}
                            onClick={() => openRejectModal(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Reject with feedback"
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

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-5">User</th>
                    <th className="py-3 px-5">Department</th>
                    <th className="py-3 px-5">Role</th>
                    <th className="py-3 px-5">Articles</th>
                    <th className="py-3 px-5">Joined</th>
                    <th className="py-3 px-5 text-right">Role Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-5 font-medium">{u.department}</td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            u.role === 'Admin'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : u.role === 'Editor'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        {u.articlesCount}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">{u.joinedDate}</td>
                      <td className="py-3.5 px-5 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="Student">Student</option>
                          <option value="Editor">Editor</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              {isLoadingCategories ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <p className="text-xs text-slate-500">Loading categories...</p>
                </div>
              ) : categories.length > 0 ? (
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div
                      key={cat._id || cat.id}
                      className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            {cat.articleCount || 0} {cat.articleCount === 1 ? 'article' : 'articles'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {cat.description || 'Topic stream for campus articles.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                        <span className="font-mono">slug: /{cat.slug}</span>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetCategory(cat)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Tag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">No categories found</p>
                  <p className="text-xs text-slate-500">Click "New Category" to create the first topic taxonomy.</p>
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
                <button
                  type="button"
                  onClick={() => openRejectModal(previewArticle)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  Reject with Feedback
                </button>
                <button
                  type="button"
                  onClick={() => setApproveTargetArticle(previewArticle)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Approve & Publish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Article Feedback Modal */}
      {rejectModalArticle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-rose-500" />
                <span>Editorial Feedback</span>
              </h3>
              <button
                onClick={() => setRejectModalArticle(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Provide constructive feedback for <strong className="text-slate-900">"{rejectModalArticle.title}"</strong>. The student writer will see this feedback and can revise and resubmit.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Feedback / Revision Notes
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Please substantiate your citations in section 2 and revise the conclusion for clarity..."
                  value={rejectionFeedback}
                  onChange={(e) => {
                    setRejectionFeedback(e.target.value);
                    if (rejectFeedbackError) setRejectFeedbackError('');
                  }}
                  className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 leading-relaxed ${
                    rejectFeedbackError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200'
                  }`}
                />
                {rejectFeedbackError && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{rejectFeedbackError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalArticle(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAction || !rejectionFeedback.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Feedback & Return</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <span>Create New Category</span>
              </h3>
              <button
                onClick={() => setShowAddCatModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence, Hostel Chronicles"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of articles that belong here..."
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  Save Category
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
        description={`Are you sure you want to approve "${approveTargetArticle?.title}"? It will immediately be published live to the public campus blog.`}
        confirmText="Approve & Publish"
        cancelText="Cancel"
        variant="primary"
        isLoading={isSubmittingAction}
        icon={ThumbsUp}
      />

      {/* Confirmation Modal for Category Deletion */}
      <ConfirmationModal
        isOpen={!!deleteTargetCategory}
        onClose={() => setDeleteTargetCategory(null)}
        onConfirm={handleConfirmDeleteCategory}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTargetCategory?.name}"? Any articles currently assigned to this category will remain in the database.`}
        confirmText="Delete Category"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeletingCategory}
        icon={Trash2}
      />

    </div>
  );
}
