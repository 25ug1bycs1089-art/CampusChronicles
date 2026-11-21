import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, FileCheck, Shield } from 'lucide-react';

export default function DashboardHeader({ title, description, activeRole = 'student' }) {
  const location = useLocation();

  const roles = [
    { name: 'Student', path: '/dashboard', icon: User, color: 'text-sky-600' },
    { name: 'Editor', path: '/editor', icon: FileCheck, color: 'text-purple-600' },
    { name: 'Admin', path: '/admin', icon: Shield, color: 'text-emerald-600' },
  ];

  return (
    <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {activeRole} Workspace
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-500 mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Role Switcher Pills for convenient review */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          {roles.map((r) => {
            const Icon = r.icon;
            const isActive = location.pathname === r.path;
            return (
              <Link
                key={r.name}
                to={r.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${r.color}`} />
                <span>{r.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
