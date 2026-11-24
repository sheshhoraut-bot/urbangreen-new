import { useState, useEffect } from 'react';
import { User, Shield, LogOut, X, Lock, Eye, EyeOff, Clock, CheckCircle, AlertTriangle, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { updateProfile, getLoginHistory, LoginHistoryEntry } from '../../lib/api';
import { useTheme } from '../../lib/ThemeContext';

interface SettingsViewProps {
  onLogout: () => void;
  currentUser: { id: number; email: string; name: string; role: string; phone: string | null; status: string } | null;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

function ChangePasswordModal({ onClose, onUpdate }: { onClose: () => void; onUpdate: (current: string, next: string) => Promise<boolean> }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (next !== confirm) { setError('New passwords do not match'); return; }
    const ok = await onUpdate(current, next);
    if (!ok) { setError('Current password is incorrect'); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">Change Password</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {[
            { label: 'Current Password', value: current, set: setCurrent, show: showCurrent, toggle: () => setShowCurrent(v => !v), placeholder: 'Enter current password' },
            { label: 'New Password', value: next, set: setNext, show: showNext, toggle: () => setShowNext(v => !v), placeholder: 'Min. 8 characters' },
            { label: 'Confirm New Password', value: confirm, set: setConfirm, show: showConfirm, toggle: () => setShowConfirm(v => !v), placeholder: 'Re-enter new password' },
          ].map(({ label, value, set, show, toggle, placeholder }) => (
            <div key={label}>
              <label className="text-muted-foreground text-sm mb-2 block">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={show ? 'text' : 'password'}
                  value={value}
                  onChange={e => { set(e.target.value); setError(''); }}
                  placeholder={placeholder}
                  className="w-full h-10 pl-9 pr-10 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#22C55E]"
                  required
                />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 h-10 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors">
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoginHistoryModal({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLoginHistory()
      .then((res) => setHistory(res.data))
      .catch((err) => {
        console.error('Failed to load login history', err);
        toast.error('Failed to load login history');
      })
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isSuccess = (action: string) => action === 'login_success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#A855F7]/20 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#A855F7]" />
            </div>
            <h3 className="text-foreground text-lg font-semibold">Login History</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-3 flex-1">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No login history available.</p>
          ) : history.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-4 bg-background rounded-xl border border-border/50">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                isSuccess(event.action) ? 'bg-[#22C55E]/20' : 'bg-red-500/20'
              }`}>
                {isSuccess(event.action)
                  ? <CheckCircle className="w-5 h-5 text-[#22C55E]" />
                  : <AlertTriangle className="w-5 h-5 text-red-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-foreground text-sm font-medium truncate">{event.description}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isSuccess(event.action) ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {isSuccess(event.action) ? 'Success' : 'Failed'}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">{event.ip_address || 'Unknown IP'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-muted-foreground text-xs">{formatTime(event.created_at)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-border">
          <button onClick={onClose} className="w-full h-10 bg-muted text-foreground rounded-lg hover:bg-muted/70 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsView({ onLogout, currentUser, onUpdatePassword }: SettingsViewProps) {
  const { theme, toggleTheme } = useTheme();
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showLoginHistory, setShowLoginHistory] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile(fullName, email);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {showChangePassword && (
        <ChangePasswordModal
          onClose={() => setShowChangePassword(false)}
          onUpdate={onUpdatePassword}
        />
      )}
      {showLoginHistory && (
        <LoginHistoryModal onClose={() => setShowLoginHistory(false)} />
      )}

      <div>
        <h2 className="text-foreground mb-2">Settings</h2>
        <p className="text-muted-foreground">Manage your account and appearance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Profile Settings */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#22C55E]/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-[#22C55E]" />
            </div>
            <h3 className="text-foreground">Profile Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-muted-foreground text-sm mb-2 block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-sm mb-2 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-sm mb-2 block">Role</label>
              <input
                type="text"
                value={currentUser?.role === 'admin' ? 'Administrator' : 'Operator'}
                disabled
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-muted-foreground cursor-not-allowed capitalize"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full h-10 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Right column: Security and Appearance */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#F59E0B]/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#F59E0B]" />
              </div>
              <h3 className="text-foreground">Security</h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full p-4 bg-background hover:bg-muted text-left rounded-xl transition-colors group border border-transparent hover:border-[#22C55E]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#F59E0B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#F59E0B]/20 transition-colors">
                    <Lock className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">Change Password</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Update your account password</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowLoginHistory(true)}
                className="w-full p-4 bg-background hover:bg-muted text-left rounded-xl transition-colors group border border-transparent hover:border-[#A855F7]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#A855F7]/10 rounded-lg flex items-center justify-center group-hover:bg-[#A855F7]/20 transition-colors">
                    <Clock className="w-4 h-4 text-[#A855F7]" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">View Login History</p>
                    <p className="text-muted-foreground text-xs mt-0.5">See recent account activity</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#A855F7]/20 rounded-xl flex items-center justify-center">
                {theme === 'dark' ? <Moon className="w-6 h-6 text-[#A855F7]" /> : <Sun className="w-6 h-6 text-[#A855F7]" />}
              </div>
              <h3 className="text-foreground">Appearance</h3>
            </div>
            <div className="flex items-center justify-between p-3 bg-background rounded-lg">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-[#F59E0B]" />}
                <span className="text-foreground">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-all ${
                  theme === 'dark' ? 'bg-[#22C55E]' : 'bg-muted'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  theme === 'dark' ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}