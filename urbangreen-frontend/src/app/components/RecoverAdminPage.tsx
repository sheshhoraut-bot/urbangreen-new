import { useState } from 'react';
import { Shield, Mail, Lock, Key, ArrowLeft, CheckCircle } from 'lucide-react';
import { recoverAdmin } from '../../lib/api';

interface RecoverAdminPageProps {
  onBackToLogin: () => void;
}

export function RecoverAdminPage({ onBackToLogin }: RecoverAdminPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await recoverAdmin(email, password, recoveryCode);
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Recovery failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#22C55E]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[#22C55E]" />
            </div>
          </div>
          <h2 className="text-foreground mb-2">Admin Access Restored</h2>
          <p className="text-muted-foreground mb-8">Your account now has administrator privileges. Please log in again.</p>
          <button
            onClick={onBackToLogin}
            className="w-full h-12 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8">
        <button
          onClick={onBackToLogin}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center">
            <Shield className="w-7 h-7 text-[#F59E0B]" />
          </div>
        </div>

        <h2 className="text-foreground text-center mb-2">Admin Recovery</h2>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          Restore administrator access to an existing account using the recovery code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-muted-foreground text-sm mb-2 block">Account Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#F59E0B]"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-muted-foreground text-sm mb-2 block">Account Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#F59E0B]"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-muted-foreground text-sm mb-2 block">Recovery Code</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                className="w-full h-11 pl-10 pr-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-[#F59E0B]"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Restore Admin Access'}
          </button>
        </form>
      </div>
    </div>
  );
}
