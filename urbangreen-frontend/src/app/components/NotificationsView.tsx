import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, AlertOctagon, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { getAlerts, markAlertRead, markAllAlertsRead, AppAlert } from '../../lib/api';

function iconFor(alert: AppAlert) {
  if (alert.severity === 'critical') return <AlertOctagon className="w-5 h-5 text-[#EF4444]" />;
  if (alert.severity === 'warning') return <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />;
  if (alert.related_type === 'care_task') return <ClipboardList className="w-5 h-5 text-[#22C55E]" />;
  return <Bell className="w-5 h-5 text-[#38BDF8]" />;
}

function bgFor(alert: AppAlert) {
  if (alert.severity === 'critical') return 'bg-[#EF4444]/10';
  if (alert.severity === 'warning') return 'bg-[#F59E0B]/10';
  if (alert.related_type === 'care_task') return 'bg-[#22C55E]/10';
  return 'bg-[#38BDF8]/10';
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

export function NotificationsView() {
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleClick = async (alert: AppAlert) => {
    if (alert.is_read) return;
    try {
      await markAlertRead(alert.id);
      setAlerts(alerts.map((a) => (a.id === alert.id ? { ...a, is_read: true } : a)));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllAlertsRead();
      setAlerts(alerts.map((a) => ({ ...a, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read', err);
      toast.error('Failed to update notifications');
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground mb-2">Notifications</h2>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border">
        {loading ? (
          <p className="p-6 text-muted-foreground">Loading notifications...</p>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          alerts.map((alert, i) => (
            <div
              key={alert.id}
              onClick={() => handleClick(alert)}
              className={`flex items-start gap-4 p-5 cursor-pointer hover:bg-muted/50 transition-colors ${
                i !== alerts.length - 1 ? 'border-b border-border' : ''
              } ${!alert.is_read ? 'bg-[#22C55E]/5' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bgFor(alert)}`}>
                {iconFor(alert)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground">{alert.message}</p>
                <p className="text-muted-foreground text-sm mt-1">{timeAgo(alert.created_at)}</p>
              </div>
              {!alert.is_read && (
                <span className="w-2 h-2 bg-[#22C55E] rounded-full mt-2 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}