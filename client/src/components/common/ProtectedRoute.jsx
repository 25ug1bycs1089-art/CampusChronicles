import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">
          Verifying session credentials...
        </span>
      </div>
    );
  }

  // If not logged in, redirect to login page with return destination state
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is restricted and user does not possess required role
  const userRole = (user.role || '').toLowerCase();
  const normalizedAllowed = (allowedRoles || []).map((r) => r.toLowerCase());
  if (allowedRoles && !normalizedAllowed.includes(userRole)) {
    const roleDashboardMap = {
      student: '/dashboard',
      admin: '/admin',
    };

    const targetDashboard = roleDashboardMap[user.role] || '/';

    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-serif font-black text-slate-900">
          Access Restricted
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your current account role (<strong className="uppercase text-slate-800">{user.role}</strong>) does not have permission to access this area.
        </p>
        <div className="pt-2">
          <Link
            to={targetDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-indigo-600 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to My Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
