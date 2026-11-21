import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Heart } from 'lucide-react';
import { mockCategories } from '../../data/mockData';

const currentYear = 2026;

export default function Footer() {

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1: About */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-serif font-black text-xl text-white tracking-tight">
                Campus Chronicles
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              The premier campus-exclusive publication platform empowering students to write, review, and exchange ideas in technology, academics, and college culture.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                Editorial Approval Workflow
              </span>
            </div>
          </div>

          {/* Col 2: Useful Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home Feed</Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">Explore Articles</Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-white transition-colors">All Categories</Link>
              </li>
              <li>
                <Link to="/write" className="hover:text-white transition-colors">Submit an Article</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Student Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Top Categories
            </h4>
            <ul className="grid grid-cols-1 gap-2 text-sm">
              {mockCategories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/explore?category=${encodeURIComponent(cat.name)}`}
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Roles & Contribution */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Editorial Governance
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every story submitted to Campus Chronicles goes through rigorous peer-review by student editors before publication.
            </p>
            <div className="space-y-1.5 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Student Submissions: Open</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Editorial Board: Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 mt-10 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            © {currentYear} Campus Chronicles. Built for university student journalism.
          </p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> by Student Developers
          </p>
        </div>
      </div>
    </footer>
  );
}
