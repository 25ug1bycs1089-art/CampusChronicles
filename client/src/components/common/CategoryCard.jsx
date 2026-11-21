import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Code,
  Coffee,
  GraduationCap,
  Briefcase,
  Calendar,
  Film,
  Heart,
  BookOpen,
  ArrowRight
} from 'lucide-react';

const iconMap = {
  Cpu,
  Code,
  Coffee,
  GraduationCap,
  Briefcase,
  Calendar,
  Film,
  Heart,
};

export default function CategoryCard({ category }) {
  if (!category) return null;

  const { name, description, iconName, articleCount, coverImage } = category;
  const IconComponent = iconMap[iconName] || BookOpen;

  return (
    <Link
      to={`/explore?category=${encodeURIComponent(name)}`}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      {/* Decorative subtle background image glow */}
      <div
        className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${coverImage})` }}
      />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors duration-200 mb-4 shadow-xs">
          <IconComponent className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">
          {name}
        </h3>

        <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-4">
          {description}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
        <span>{articleCount === 1 ? '1 published article' : `${articleCount || 0} published articles`}</span>
        <span className="flex items-center gap-1 text-indigo-600 group-hover:translate-x-1 transition-transform">
          Explore <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}
