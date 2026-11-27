import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { forgotPasswordRequest, resetPasswordRequest } from '../../lib/api';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onSwitchToRegister: () => void;
  onForgotPassword?: (email: string, newPassword: string) => boolean;
  onRecoverAdmin: () => void;
}

type View = 'login' | 'forgot-email' | 'forgot-sent' | 'reset' | 'reset-success';

type ResetLink = { token: string; email: string };

function readResetLink(): ResetLink | null {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('reset_token');
  const email = params.get('email');
  return token && email ? { token, email } : null;
}

function clearResetLink() {
  if (window.location.search) {
    window.history.replaceState({}, '', window.location.pathname);
  }
}

function Logo() {
  return (
    <div className="flex items-center gap-3 mb-6 md:mb-8">
      <div className="w-14 h-14 md:w-20 md:h-20 shrink-0 bg-[#22C55E] rounded-lg flex items-center justify-center">
        <span className="text-white text-3xl md:text-5xl">{'\u{1F331}'}</span>
      </div>
      <span className="text-[#22C55E] text-2xl md:text-3xl tracking-wide">URBANGREEN+</span>
    </div>
  );
}

function RightPanel() {
  return (
    <div className="hidden md:flex w-1/2 bg-background items-center justify-center p-12 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-64 h-64 bg-[#22C55E]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-[#22C55E]/20 rounded-full blur-3xl" />
      <div className="relative z-10 text-center max-w-lg">
        <div className="mb-6 text-8xl">{'\u{1F331}'}</div>
        <h2 className="text-[#22C55E] mb-4">Smart Urban Farming</h2>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Manage your urban garden with logged readings, plant care tasks, and clear insights for healthy plant growth.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          {['Zone Monitoring', 'Care Tasks', 'Plant Library'].map((label) => (
            <div key={label} className="px-4 py-2 bg-[#22C55E]/10 border border-[#22C55E] rounded-full text-[#22C55E]">
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-[#F59E0B]" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
      </button>
      <div className="w-full md:w-1/2 bg-background flex items-center justify-center px-6 pt-20 pb-10 md:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <RightPanel />
    </div>
  );
}

export function LoginPage({ onLogin, onSwitchToRegister, onRecoverAdmin }: LoginPageProps) {
  const [resetLink, setResetLink] = useState<ResetLink | null>(readResetLink);
  const [view, setView] = useState<View>(resetLink ? 'reset' : 'login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [fpEmail, setFpEmail] = useState('');
  const [fpError, setFpError] = useState('');
  const [sending, setSending] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetError, setResetError] = useState('');
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');
    if (!fpEmail.trim()) {
      setFpError('Please enter your email address');
      return;
    }
    setSending(true);
    try {
      await forgotPasswordRequest(fpEmail.trim());
      setView('forgot-sent');
    } catch (err: any) {
      if (err.response?.status === 429) {
        setFpError('Too many requests. Please wait a minute and try again.');
      } else {
        setFpError(err.response?.data?.message || 'Could not send the email. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetLink) return;
    setResetError('');
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    setResetting(true);
    try {
      await resetPasswordRequest(resetLink.token, resetLink.email, newPassword, confirmPassword);
      clearResetLink();
      setResetLink(null);
      setView('reset-success');
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        const first = (Object.values(errors)[0] as string[])?.[0];
        setResetError(first || 'Please check your password and try again');
      } else if (err.response?.status === 422) {
        setLinkInvalid(true);
        setResetError(err.response?.data?.message || 'This reset link is invalid or has expired.');
      } else if (err.response?.status === 429) {
        setResetError('Too many attempts. Please wait a minute and try again.');
      } else {
        setResetError('Something went wrong. Please try again.');
      }
    } finally {
      setResetting(false);
    }
  };

  const resetForgotFields = () => {
    setFpEmail('');
    setFpError('');
  };

  const handleBackToLogin = () => {
    clearResetLink();
    setResetLink(null);
    resetForgotFields();
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setLinkInvalid(false);
    setView('login');
  };

  const handleRequestNewLink = () => {
    clearResetLink();
    const knownEmail = resetLink?.email || '';
    setResetLink(null);
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
    setLinkInvalid(false);
    setFpEmail(knownEmail);
    setFpError('');
    setView('forgot-email');
  };

  if (view === 'reset-success') {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-[#22C55E]/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-[#22C55E]" />
            </div>
          </div>
          <h2 className="text-foreground mb-2">Password Reset!</h2>
          <p className="text-muted-foreground mb-8">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
          <button
            onClick={handleBackToLogin}
            className="w-full h-12 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-all shadow-lg shadow-[#22C55E]/20"
          >
            Back to Login
          </button>
        </div>
      </AuthShell>
    );
  }

  if (view === 'forgot-sent') {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-[#22C55E]/10 rounded-full flex items-center justify-center">
              <Mail className="w-12 h-12 text-[#22C55E]" />
            </div>
          </div>
          <h2 className="text-foreground mb-2">Check your inbox</h2>
          <p className="text-muted-foreground mb-2 break-words">
            If <strong className="text-foreground">{fpEmail}</strong> is registered, we sent a link to reset your password.
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            The link works once and expires in 60 minutes. If you don't see the email, check your Spam folder.
          </p>
          <button
            onClick={handleBackToLogin}
            className="w-full h-12 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-all shadow-lg shadow-[#22C55E]/20"
          >
            Back to Login
          </button>
          <button
            onClick={() => setView('forgot-email')}
            className="mt-4 text-[#22C55E] hover:text-[#16A34A] transition-colors text-sm"
          >
            Use a different email or send again
          </button>
        </div>
      </AuthShell>
    );
  }

  if (view === 'forgot-email') {
    return (
      <AuthShell>
        <Logo />
        <button
          onClick={handleBackToLogin}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
        <h2 className="text-foreground mb-2">Forgot Password</h2>
        <p className="text-muted-foreground mb-8">Enter your registered email address and we will send you a link to reset your password.</p>
        <form onSubmit={handleForgotSubmit} className="space-y-5">
          <div>
            <label className="block text-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="email"
                value={fpEmail}
                onChange={(e) => setFpEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
                required
              />
            </div>
          </div>
          {fpError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {fpError}
            </div>
          )}
          <button
            type="submit"
            disabled={sending}
            className="w-full h-12 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-all shadow-lg shadow-[#22C55E]/20 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      </AuthShell>
    );
  }

  if (view === 'reset') {
    return (
      <AuthShell>
        <Logo />
        <h2 className="text-foreground mb-2">Set New Password</h2>
        <p className="text-muted-foreground mb-8 break-words">
          Enter a new password for <strong className="text-foreground">{resetLink?.email}</strong>
        </p>
        <form onSubmit={handleResetSubmit} className="space-y-5">
          <div>
            <label className="block text-foreground mb-2">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full h-12 pl-12 pr-12 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-foreground mb-2">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="w-full h-12 pl-12 pr-12 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {resetError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {resetError}
            </div>
          )}
          {linkInvalid ? (
            <button
              type="button"
              onClick={handleRequestNewLink}
              className="w-full h-12 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-all shadow-lg shadow-[#22C55E]/20"
            >
              Request a new link
            </button>
          ) : (
            <button
              type="submit"
              disabled={resetting}
              className="w-full h-12 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-all shadow-lg shadow-[#22C55E]/20 disabled:opacity-50"
            >
              {resetting ? 'Saving...' : 'Reset Password'}
            </button>
          )}
          <button
            type="button"
            onClick={handleBackToLogin}
            className="w-full text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Back to Login
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Logo />
      <h2 className="text-foreground mb-2">Welcome Back!</h2>
      <p className="text-muted-foreground mb-8">Sign in to access your urban garden dashboard</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-foreground mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@urbangreen.com"
              className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-foreground mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-12 pl-12 pr-12 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => { setFpEmail(email); setFpError(''); setView('forgot-email'); }}
            className="text-[#22C55E] hover:text-[#16A34A] transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <button
          type="submit"
          className="w-full h-12 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-all shadow-lg shadow-[#22C55E]/20"
        >
          Login
        </button>
      </form>
      <p className="text-center text-muted-foreground mt-8">
        {"Don't have an account? "}
        <button onClick={onSwitchToRegister} className="text-[#22C55E] hover:text-[#16A34A]">Sign up</button>
      </p>
      <p className="text-center text-muted-foreground/60 mt-3">
        <button onClick={onRecoverAdmin} className="text-xs hover:text-muted-foreground transition-colors">
          Lost admin access?
        </button>
      </p>
    </AuthShell>
  );
}