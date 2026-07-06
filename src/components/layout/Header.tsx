import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../lib/supabase';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Plus,
  Check,
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onNewIdea: () => void;
}

export default function Header({ onMenuClick, darkMode, toggleDarkMode, onNewIdea }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoadingNotifications(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data ?? []);
    setUnreadCount(data?.filter((notification) => !notification.read).length ?? 0);
    setLoadingNotifications(false);
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  return (
    <header className={`h-16 backdrop-blur-xl border-b flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 transition-colors duration-300 ${darkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-white/80 border-slate-200'}`}>
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>TSDPL BI Workflow</h1>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{formatDate(currentTime)}</p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Time display */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <span className="text-sm font-medium text-slate-300">{formatTime(currentTime)}</span>
        </div>

        {/* Submit Idea button */}
        <button
          onClick={onNewIdea}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Submit Idea</span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-lg transition-all ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white bg-red-500 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl shadow-black/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <span className="text-xs text-slate-400">{unreadCount} unread</span>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {loadingNotifications ? (
                  <div className="p-4 text-slate-400 text-sm">Loading notifications...</div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-slate-700/50 ${!notification.read ? 'bg-slate-700/20' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300">
                          <Check className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{notification.title}</p>
                          <p className="text-xs text-slate-400 mt-1 truncate">{notification.message}</p>
                          <p className="text-xs text-slate-500 mt-2">{new Date(notification.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-slate-400 text-sm">No notifications yet</div>
                )}
              </div>
              <div className="px-4 py-3 border-t border-slate-700">
                <button
                  onClick={fetchNotifications}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl shadow-black/20 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {profile?.role || 'admin'}
                </span>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors">
                  <User className="w-4 h-4" />
                  View Profile
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
              <div className="border-t border-slate-700 py-1">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
