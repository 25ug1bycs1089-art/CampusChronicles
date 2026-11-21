import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Heart } from 'lucide-react';

export default function ArticleCard({ article, variant = 'grid' }) {
  if (!article) return null;

  const id = article._id || article.id;
  const title = article.title || 'Untitled Article';
  const excerpt = article.excerpt || '';
  const coverImage =
    article.coverImage ||
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80';
  const category = article.category || 'General';
  const author = article.author || { name: 'Campus Student' };
  const authorName = author.name || 'Campus Student';
  const authorAvatar = author.profilePicture || author.avatar || '';
  const authorDept = author.department || '';

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

  const publishedDate = formatDate(article.publishedAt || article.createdAt);

  const wordCount = (article.content || article.excerpt || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readTime = article.readTime || `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
  const views = typeof article.views === 'number' ? article.views : null;
  const likes = typeof article.likes === 'number' ? article.likes : null;
  const isEditorsPick = Boolean(article.isEditorsPick);

  if (variant === 'horizontal') {
    return (
      <article className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col sm:flex-row">
        <Link
          to={`/article/${id}`}
          className="sm:w-1/3 h-48 sm:h-auto relative overflow-hidden bg-slate-100 block shrink-0"
        >
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {category && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/90 backdrop-blur text-slate-800 shadow-xs">
              {category}
            </span>
          )}
        </Link>

        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isEditorsPick && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Editor's Pick
                </span>
              )}
              <span className="text-xs text-slate-400">{publishedDate}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {readTime}
              </span>
            </div>

            <Link to={`/article/${id}`}>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
                {title}
              </h3>
            </Link>

            <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed mb-4">
              {excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2.5">
              {authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                  {authorName[0]}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-slate-800 leading-tight">{authorName}</p>
                {authorDept && <p className="text-[11px] text-slate-400 leading-tight">{authorDept}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              {views !== null && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {views}
                </span>
              )}
              {likes !== null && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/10" />
                  {likes}
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Default Grid Variant
  return (
    <article className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      <Link
        to={`/article/${id}`}
        className="h-48 w-full relative overflow-hidden bg-slate-100 block"
      >
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/90 backdrop-blur text-slate-800 shadow-xs">
            {category}
          </span>
        )}
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            {isEditorsPick && (
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Editor's Pick
              </span>
            )}
            <span className="text-xs text-slate-400">{publishedDate}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {readTime}
            </span>
          </div>

          <Link to={`/article/${id}`}>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-snug">
              {title}
            </h3>
          </Link>

          <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed mb-4">
            {excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-2">
            {authorAvatar ? (
              <img
                src={authorAvatar}
                alt={authorName}
                className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center uppercase shrink-0">
                {authorName[0]}
              </div>
            )}
            <span className="text-xs font-medium text-slate-700 truncate max-w-[130px]">
              {authorName}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            {views !== null && (
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {views}
              </span>
            )}
            {likes !== null && (
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                {likes}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
