import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Compass,
  SlidersHorizontal,
  LayoutGrid,
  List,
  RotateCcw,
  BookOpen,
  Loader2,
  AlertCircle
} from 'lucide-react';
import ArticleCard from '../components/common/ArticleCard';
import SearchBar from '../components/common/SearchBar';
import CategoryFilter from '../components/common/CategoryFilter';
import apiClient from '../api/client';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get('category') || 'All';
  const urlSearch = searchParams.get('search') || '';
  const urlSort = searchParams.get('sort') || 'latest';

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [sortBy, setSortBy] = useState(urlSort); // 'latest' | 'popular' | 'oldest'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'horizontal'

  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, totalPages: 1, hasMore: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Sync searchQuery state when urlSearch changes
  useEffect(() => {
    setSearchQuery(urlSearch);
  }, [urlSearch]);

  // Sync sortBy state when urlSort changes
  useEffect(() => {
    setSortBy(urlSort);
  }, [urlSort]);

  // Fetch available categories from API
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const res = await apiClient.get('/categories');
        if (isMounted && res.data?.success) {
          setCategories(res.data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch published articles from API with search, category, sort, and pagination
  const fetchArticles = useCallback(async (pageToLoad = 1, append = false) => {
    if (pageToLoad === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const params = {
        page: pageToLoad,
        limit: 9,
        sort: sortBy,
      };

      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (urlSearch && urlSearch.trim()) {
        params.search = urlSearch.trim();
      }

      const response = await apiClient.get('/articles', { params });

      if (response.data?.success) {
        const newArticles = response.data.articles || [];
        setArticles((prev) => (append ? [...prev, ...newArticles] : newArticles));
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve published articles');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedCategory, urlSearch, sortBy]);

  // Trigger fetch when category, search query param, or sort changes
  useEffect(() => {
    fetchArticles(1, false);
  }, [fetchArticles]);

  // Handle Search Input Debounce / Change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== urlSearch) {
        const newParams = new URLSearchParams(searchParams);
        if (searchQuery.trim()) {
          newParams.set('search', searchQuery.trim());
        } else {
          newParams.delete('search');
        }
        setSearchParams(newParams);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, urlSearch, searchParams, setSearchParams]);

  const handleCategoryChange = (categoryName) => {
    const newParams = new URLSearchParams(searchParams);
    if (categoryName === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', categoryName);
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    const newParams = new URLSearchParams(searchParams);
    if (newSort === 'latest') {
      newParams.delete('sort');
    } else {
      newParams.set('sort', newSort);
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSortBy('latest');
    setSearchParams({});
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.hasMore) {
      fetchArticles(pagination.page + 1, true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Compass className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Archive & Index
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
          Explore Articles
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
          Search across our campus repository of student-written articles, tutorials, and memoirs.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="w-full md:flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by article title, keyword, or author name..."
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="latest">Latest First</option>
                <option value="popular">Most Read / Popular</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('horizontal')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'horizontal'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryChange}
            />
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-900 font-semibold">{pagination.total}</strong> {pagination.total === 1 ? 'published article' : 'published articles'}
          {selectedCategory !== 'All' && (
            <span> in <strong className="text-indigo-600">{selectedCategory}</strong></span>
          )}
          {urlSearch && (
            <span> matching "<strong className="text-slate-900">{urlSearch}</strong>"</span>
          )}
        </span>

        {(selectedCategory !== 'All' || urlSearch || sortBy !== 'latest') && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Articles Feed */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs text-slate-500">Searching published campus archives...</p>
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto p-8 text-center space-y-3 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-xs font-medium text-rose-800">{error}</p>
          <button
            onClick={() => fetchArticles(1, false)}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      ) : articles.length > 0 ? (
        <div className="space-y-8">
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {articles.map((article) => (
              <ArticleCard
                key={article._id || article.id}
                article={article}
                variant={viewMode}
              />
            ))}
          </div>

          {/* Load More Pagination */}
          {pagination.hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
                <span>Load More Articles ({pagination.total - articles.length} remaining)</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto space-y-4 my-10">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">No published articles found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {urlSearch
                ? `No articles match "${urlSearch}". Try another keyword or clear your filters.`
                : 'No published articles match the selected category filter.'}
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer"
          >
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>
  );
}
