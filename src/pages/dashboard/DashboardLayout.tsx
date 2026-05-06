import { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../lib/store';
import { useTheme } from '../../components/ThemeProvider';
import NotificationBell from '../../components/notifications/NotificationBell';
import {
  LayoutDashboard, Compass, MessageCircle, Target, Calendar,
  Star, Settings, LogOut, Menu, X, ChevronDown, ChevronRight,
  User, Edit3, Sun, Moon, Search,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/explore', icon: Compass, label: 'Explore', menteeOnly: true },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/events', icon: Calendar, label: 'Events' },
  { to: '/ratings', icon: Star, label: 'Ratings' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const filteredNav = NAV_ITEMS.filter(item => {
    if (item.menteeOnly && profile?.role !== 'mentee') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-montserrat">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
            <Link to="/dashboard">
              <img src="/logo.jpg" alt="Propel" className="h-7" />
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  isActive ? 'sidebar-link-active' : 'sidebar-link'
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-700">
            <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 shadow-nav">
          <div className="flex items-center justify-between px-6 py-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-slate-800">
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden lg:block" />

            <div className="flex items-center gap-4">
              {/* Notification bell */}
              <NotificationBell />

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold">
                    {profile?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">{profile?.full_name}</p>
                    <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                    <div className="absolute right-0 top-12 z-50 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-card-hover border border-slate-100 dark:border-slate-700 py-2 animate-fade-in">
                      <Link to="/profile" className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setProfileMenuOpen(false)}>
                        <span className="flex items-center gap-3">
                          <Search className="w-4 h-4" /> View profile
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                      <Link to="/profile?edit=basic" className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setProfileMenuOpen(false)}>
                        <span className="flex items-center gap-3">
                          <Edit3 className="w-4 h-4" /> Edit profile
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                      <Link to="/settings" className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setProfileMenuOpen(false)}>
                        <span className="flex items-center gap-3">
                          <User className="w-4 h-4" /> Account settings
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </Link>
                      <button onClick={() => { toggleTheme(); setProfileMenuOpen(false); }} className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <span className="flex items-center gap-3">
                          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          Theme
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{theme}</span>
                      </button>
                      <hr className="my-1 border-slate-100 dark:border-slate-700" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <LogOut className="w-4 h-4" /> Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

