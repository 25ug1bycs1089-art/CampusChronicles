import React, { useState, useEffect } from 'react';
import { Layers, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import CategoryCard from '../components/common/CategoryCard';
import apiClient from '../api/client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/categories');
        if (isMounted && response.data?.success) {
          setCategories(response.data.categories || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load categories');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 pb-20">
      {/* Header */}
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Editorial Taxonomy
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
          Explore by Category
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
          Discover student journalism across dedicated campus subjects, from software engineering tutorials to placement survival guides and campus culture memoirs.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs text-slate-500">Loading topic streams...</p>
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto p-8 text-center space-y-3 bg-rose-50 border border-rose-200 rounded-2xl">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
          <p className="text-xs font-medium text-rose-800">{error}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">No categories defined yet</p>
          <p className="text-xs text-slate-500">Categories created by platform admins will appear here.</p>
        </div>
      ) : (
        /* Categories Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category._id || category.id || category.slug} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
