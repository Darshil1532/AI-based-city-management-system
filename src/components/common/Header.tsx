import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Bell,
  Search,
  Check,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Menu,
  X,
  Keyboard,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  onToggleMobileMenu,
  isMobileSidebarOpen,
}) => {
  const navigate = useNavigate();
  const handleToggle = onToggleMobileMenu || onToggleMobileSidebar;
  const {
    currentUser,
    setIsAuthModalOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    openCommandBar,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    clearAllNotifications,
    resetToDefaults,
    aiProviderType,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside or escape event
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    function handleGlobalEscape() {
      setShowNotifications(false);
      setShowResetConfirm(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('app:escape', handleGlobalEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('app:escape', handleGlobalEscape);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      openCommandBar();
      return;
    }
    openCommandBar(rawQuery);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-40 clay-header transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {handleToggle && (
              <button
                type="button"
                onClick={handleToggle}
                className="lg:hidden p-2 rounded-xl clay-btn-secondary text-slate-600 hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

            <Link
              to="/"
              className="flex items-center gap-3 group transition-transform active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-2xl clay-btn-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 tracking-tight">
                    SmartCity
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full clay-badge bg-white text-slate-700">
                    Gov OS
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline tracking-tight">
                  Intelligent Civic Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Tactile Quick Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xs md:max-w-md hidden sm:block"
          >
            <div className="relative group">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-slate-700 transition-colors" />
              <input
                id="global-search-input"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => openCommandBar(searchQuery)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    searchInputRef.current?.blur();
                  }
                }}
                placeholder="Search complaints, districts, or departments..."
                className="w-full pl-9 pr-14 py-2 text-xs clay-inset text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all cursor-pointer focus:ring-2 focus:ring-blue-400/20"
              />
              <button
                type="button"
                onClick={() => openCommandBar(searchQuery)}
                className="hidden lg:inline-flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 h-5 px-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-800 bg-white/90 rounded-md shadow-2xs border border-white cursor-pointer transition-colors"
                title="Press / or ⌘K to open command palette"
              >
                /
              </button>
            </div>
          </form>

          {/* Controls: User Profile, Notifications, Demo Reset */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Authenticated User Profile & Role Indicator */}
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl clay-btn-secondary text-xs font-semibold text-slate-800 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
              title="View account clearance & credentials"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentUser.role === 'admin'
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'bg-blue-600 text-white shadow-xs'
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="font-mono text-[11px] font-bold text-slate-900 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[9px] text-slate-400 font-mono leading-none">
                  {currentUser.role === 'admin' ? 'Clearance Level 4' : 'Resident Portal'}
                </span>
              </div>
              <span
                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  currentUser.role === 'admin'
                    ? 'clay-badge-amber'
                    : 'clay-badge-blue'
                }`}
              >
                {currentUser.role === 'admin' ? 'Admin' : 'Citizen'}
              </span>
            </button>

            {/* Keyboard Shortcuts Trigger Button */}
            <button
              type="button"
              id="btn-shortcuts-toggle"
              onClick={() => setIsShortcutsModalOpen(!isShortcutsModalOpen)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl clay-btn-secondary text-slate-600 hover:text-slate-900 focus:outline-none text-xs cursor-pointer"
              title="Keyboard Shortcuts (Press ?)"
              aria-label="View Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4 text-slate-500" />
              <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-600 bg-slate-100 rounded-md border border-slate-200">
                ?
              </kbd>
            </button>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl clay-btn-secondary text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl clay-card py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Live Municipal Alerts
                    </span>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No notifications at this time
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.link) {
                              navigate(n.link);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                            !n.read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-800">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {n.timestamp}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Reset Data */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset complaints and hotspots to initial smart city mock dataset?')) {
                  resetToDefaults();
                }
              }}
              title="Reset Sample Data"
              className="p-2 rounded-xl clay-btn-secondary text-slate-500 hover:text-slate-800 transition-colors hidden sm:inline-flex cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
