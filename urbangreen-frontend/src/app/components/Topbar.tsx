import { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, Settings, UserCircle } from 'lucide-react';
import { getAlerts, markAlertRead, markAllAlertsRead, AppAlert } from '../../lib/api';

interface TopbarProps {
  title: string;
  onLogout?: () => void;
  currentUser?: { name: string; role: string } | null;
  onNavigate?: (page: string) => void;
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function Topbar({ title, onLogout, currentUser, onNavigate }: TopbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const loadAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res.data);
      setUnreadCount(res.unread_count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageForAlert = (alert: AppAlert) => {
    if (alert.related_type === 'care_task') return 'care-tasks';
    if (alert.related_type === 'zone_reading') return 'readings';
    if (alert.related_type === 'inventory_item') return 'inventory';
    return null;
  };

  const handleAlertClick = async (alert: AppAlert) => {
    if (!alert.is_read) {
      try {
        await markAlertRead(alert.id);
        setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, is_read: true } : a)));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (err) {
        console.error('Failed to mark notification as read', err);
      }
    }
    const page = pageForAlert(alert);
    if (page) {
      onNavigate?.(page);
      setShowNotifications(false);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAlertsRead();
      setAlerts(alerts.map((a) => ({ ...a, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const recentAlerts = alerts.slice(0, 6);

  return (
    <div className="h-[70px] bg-card border-b border-border flex items-center justify-between px-8">
      <h1 className="text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) loadAlerts();
            }}
            className="relative p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#22C55E] rounded-full text-white text-[10px] flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAll} className="text-[#22C55E] text-xs hover:text-[#16A34A]">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {recentAlerts.length === 0 ? (
                  <p className="p-4 text-muted-foreground text-sm">No notifications yet.</p>
                ) : (
                  recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      className={`p-4 border-b border-border hover:bg-muted cursor-pointer ${
                        !alert.is_read ? 'bg-[#22C55E]/5' : ''
                      }`}
                    >
                      <p className="text-foreground text-sm">{alert.message}</p>
                      <p className="text-muted-foreground text-xs mt-1">{timeAgo(alert.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 text-center border-t border-border">
                <button
                  onClick={() => { onNavigate && onNavigate('notifications'); setShowNotifications(false); }}
                  className="text-[#22C55E] text-sm hover:text-[#16A34A]"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-4 border-l border-border hover:bg-muted rounded-lg p-2 transition-colors"
          >
            <div className="w-9 h-9 bg-[#22C55E] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-foreground">{currentUser?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground capitalize">{currentUser?.role || ''}</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-2">
                <button
                  onClick={() => { onNavigate?.('settings'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-foreground"
                >
                  <UserCircle className="w-5 h-5" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => { onNavigate?.('settings'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-foreground"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                <div className="h-px bg-border my-2"></div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg transition-colors text-red-400"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}