import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PenSquare,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award,
  Users,
  BookOpen,
  Loader2,
  AlertCircle
} from 'lucide-react';
import ArticleCard from '../components/common/ArticleCard';
import CategoryCard from '../components/common/CategoryCard';
import apiClient from '../api/client';

export default function HomePage() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [articlesRes, categoriesRes] = await Promise.all([
          apiClient.get('/articles?limit=8&sort=latest'),
          apiClient.get('/categories'),
        ]);

        if (isMounted) {
          if (articlesRes.data?.success) {
            setArticles(articlesRes.data.articles || []);
          }
          if (categoriesRes.data?.success) {
            setCategories(categoriesRes.data.categories || []);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load content from server');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const editorsPicks = articles.slice(1, 4);
  const latestArticles = articles.slice(0, 6);

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. Hero Section */}
      <section className="bg-white border-b border-slate-200/80 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Journalism & Insights</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
              Ideas, stories, and insights from our campus.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
              Campus Chronicles is our student-run publishing platform. Read in-depth engineering breakdowns, placement playbooks, campus life memoirs, and research stories.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-indigo-600 transition-colors shadow-xs"
              >
                <span>Start Reading</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/write"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors border border-slate-200"
              >
                <PenSquare className="w-4 h-4 text-indigo-500" />
                <span>Write an Article</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {isLoading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-xs font-medium text-slate-500">Loading published campus stories...</p>
        </div>
      ) : error ? (
        <div className="max-w-md mx-auto px-4 py-12 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Unable to load feed</h3>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      ) : articles.length === 0 ? (
        /* Empty State */
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
          <BookOpen className="w-12 h-12 text-indigo-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">No Published Stories Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Be the first campus writer to publish! Draft your tutorial, campus perspective, or academic notes and submit to our editorial review team.
          </p>
          <div className="pt-2">
            <Link
              to="/write"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <PenSquare className="w-4 h-4" />
              <span>Write the First Article</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Featured / Editor's Spotlight */}
          {featuredArticle && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Featured Editorial
                  </h2>
                </div>
                <Link
                  to="/explore"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Explore all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Hero Card */}
                <div className="lg:col-span-7">
                  <ArticleCard article={featuredArticle} variant="grid" />
                </div>

                {/* Editor's Picks Column */}
                <div className="lg:col-span-5 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span>Recent Highlights</span>
                  </h3>
                  <div className="divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/80 p-2 shadow-xs">
                    {editorsPicks.length > 0 ? (
                      editorsPicks.map((art) => {
                        const artId = art._id || art.id;
                        const wordCount = (art.content || art.excerpt || '')
                          .replace(/<[^>]*>/g, ' ')
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean).length;
                        const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

                        return (
                          <div key={artId} className="p-4 hover:bg-slate-50 rounded-lg transition-colors">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                              <span className="font-semibold text-indigo-600">{art.category}</span>
                              <span>•</span>
                              <span>{readTime}</span>
                            </div>
                            <Link to={`/article/${artId}`}>
                              <h4 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-2 mb-1">
                                {art.title}
                              </h4>
                            </Link>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {art.excerpt}
                            </p>
                            <div className="flex items-center gap-2 mt-3 pt-2 text-xs text-slate-600">
                              {art.author?.profilePicture ? (
                                <img
                                  src={art.author.profilePicture}
                                  alt={art.author.name}
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                                  {art.author?.name ? art.author.name[0] : 'S'}
                                </div>
                              )}
                              <span>{art.author?.name || 'Student Writer'}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        More articles will appear here as the editorial board publishes submissions.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 3. Popular Categories */}
          {categories.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Browse Topics
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Curated categories across academic domains and student life.
                  </p>
                </div>
                <Link
                  to="/categories"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  All Categories ({categories.length}) <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {categories.slice(0, 4).map((category) => (
                  <CategoryCard key={category._id || category.id} category={category} />
                ))}
              </div>
            </section>
          )}

          {/* 4. Latest Articles Feed */}
          {latestArticles.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Latest Stories
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Freshly approved articles from students and campus societies.
                  </p>
                </div>
                <Link
                  to="/explore"
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View All Articles <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestArticles.map((article) => (
                  <ArticleCard key={article._id || article.id} article={article} variant="grid" />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 5. Call-To-Action for Student Contributors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Users className="w-3.5 h-3.5" />
              Student Authors Wanted
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Have a campus story, research breakthrough, or technical tutorial to share?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Every college journey holds valuable lessons. Submit your drafts to our editorial board, receive constructive feedback, and publish your voice to the campus community.
            </p>
            <div className="pt-2">
              <Link
                to="/write"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-slate-900 hover:bg-indigo-50 transition-colors shadow-sm"
              >
                <PenSquare className="w-4 h-4 text-indigo-600" />
                <span>Submit Your Story Today</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
