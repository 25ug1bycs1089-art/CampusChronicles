import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  PenSquare,
  Menu,
  X,
  User,
  Shield,
  ChevronDown,
  LogOut,
  Search,
  Loader2,
  BookOpen,
  ArrowRight,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/client';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Profile picture upload state
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const profilePicInputRef = useRef(null);

  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore', path: '/explore' },
    { name: 'Categories', path: '/categories' },
  ];

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setRoleDropdownOpen(false);
    setUserDropdownOpen(false);
    setShowSearchDropdown(false);
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/login');
  };

  const getRoleDashboard = (role) => {
    switch (role) {
      case 'admin':
        return '/admin';
      default:
        return '/dashboard';
    }
  };

  const isAdmin = user && user.role === 'admin';

  // Handle Search input change with debounce
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await apiClient.get('/articles', {
          params: { search: searchTerm.trim(), limit: 5 },
        });
        if (response.data?.success) {
          setSearchResults(response.data.articles || []);
        }
      } catch (err) {
        console.error('Navbar search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    const query = searchTerm.trim();
    setShowSearchDropdown(false);
    setSearchTerm('');
    closeMenu();
    navigate(`/explore?search=${encodeURIComponent(query)}`);
  };

  const handleSelectResult = (articleId) => {
    setShowSearchDropdown(false);
    setSearchTerm('');
    closeMenu();
    navigate(`/article/${articleId}`);
  };

  // Profile picture upload handler
  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = uploadRes.data?.url;
      if (url) {
        await apiClient.put('/auth/me', { profilePicture: url });
        // Refresh auth context so avatar updates immediately
        if (checkAuth) await checkAuth();
      }
    } catch (err) {
      console.error('Profile picture upload failed:', err);
    } finally {
      setIsUploadingAvatar(false);
      // Reset so same file can be re-selected
      if (profilePicInputRef.current) profilePicInputRef.current.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group" onClick={closeMenu}>
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-indigo-600 transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-black text-lg tracking-tight text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">
                  Campus Chronicles
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 mt-0.5">
                  The Student Publication
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50/70 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Functional Search Bar in Navigation Bar */}
          <div ref={searchContainerRef} className="relative hidden md:block flex-1 max-w-xs lg:max-w-sm">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search articles & authors..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-full pl-9 pr-7 py-1.5 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 placeholder-slate-400 transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setSearchResults([]);
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>

            {/* Live Dropdown Results */}
            {showSearchDropdown && searchTerm.trim() && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                  <span>Search Results</span>
                  {isSearching && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
                </div>

                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400 space-y-1">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto text-indigo-600" />
                    <span>Searching published archives...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div>
                    {searchResults.map((art) => (
                      <button
                        key={art._id}
                        type="button"
                        onClick={() => handleSelectResult(art._id)}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{art.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {art.category} • by {art.author?.name || 'Student Writer'}
                          </p>
                        </div>
                      </button>
                    ))}
                    <div className="pt-1.5 mt-1 border-t border-slate-100 px-3">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="w-full py-1 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>View all results for "{searchTerm}"</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No articles found matching "<strong className="text-slate-800">{searchTerm}</strong>"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Write Button */}
            <Link
              to="/write"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              <PenSquare className="w-4 h-4 text-indigo-500" />
              <span>Write</span>
            </Link>

            {/* Role-Aware Dashboard Access for Logged In Users */}
            {user && (
              <>
                {isAdmin ? (
                  <div className="relative">
                    <button
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <span>Dashboards</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    </button>

                    {roleDropdownOpen && (
                      <div
                        className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                        onMouseLeave={() => setRoleDropdownOpen(false)}
                      >
                        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Role Workspaces
                        </div>
                        <Link
                          to="/dashboard"
                          onClick={closeMenu}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                        >
                          <User className="w-4 h-4 text-sky-500" />
                          <span>Student Writer</span>
                        </Link>
                        <Link
                          to="/admin"
                          onClick={closeMenu}
                          className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                        >
                          <Shield className="w-4 h-4 text-emerald-500" />
                          <span>Platform Governance</span>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>My Dashboard</span>
                  </Link>
                )}
              </>
            )}

            <div className="h-5 w-[1px] bg-slate-200 mx-1" />

            {/* Authenticated State vs Guest State */}
            {user ? (
              <div className="relative">
                {/* Hidden file input for profile picture upload */}
                <input
                  type="file"
                  ref={profilePicInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleProfilePicChange}
                />
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 cursor-pointer"
                >
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                      {user.name ? user.name[0] : 'U'}
                    </div>
                  )}
                  <div className="text-left hidden lg:block pr-1">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                      {user.name}
                    </p>
                    <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      {/* Clickable avatar to change profile picture */}
                      <button
                        type="button"
                        onClick={() => profilePicInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="relative group mb-2 block"
                        title="Change profile picture"
                      >
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center uppercase">
                            {user.name ? user.name[0] : 'U'}
                          </div>
                        )}
                        <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {isUploadingAvatar ? (
                            <Loader2 className="w-4 h-4 text-white animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </button>
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {user.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to={getRoleDashboard(user.role)}
                        onClick={closeMenu}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>My Dashboard</span>
                      </Link>

                      <Link
                        to="/write"
                        onClick={closeMenu}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
                      >
                        <PenSquare className="w-4 h-4 text-slate-400" />
                        <span>Write an Article</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-slate-900 hover:bg-indigo-600 px-4 py-2 rounded-lg transition-colors shadow-2xs"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              to="/write"
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              title="Write article"
            >
              <PenSquare className="w-5 h-5 text-indigo-600" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Search Form */}
          <form onSubmit={handleSearchSubmit} className="pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search articles & authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
              />
            </div>
          </form>

          {user && (
            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                {user.role}
              </span>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `block px-3.5 py-2 rounded-lg text-base font-medium ${
                    isActive
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {user && (
            <div className="pt-3 border-t border-slate-100">
              <p className="px-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Workspaces
              </p>
              <div className="space-y-1">
                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  <User className="w-4 h-4 text-sky-500" />
                  <span>Student Writer Dashboard</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMenu}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-center py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
              >
                Sign Out ({user.name})
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="w-full text-center py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="w-full text-center py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-indigo-600 rounded-lg"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
