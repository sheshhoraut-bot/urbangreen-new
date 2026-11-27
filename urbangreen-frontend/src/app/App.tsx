import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { RecoverAdminPage } from './components/RecoverAdminPage';
import { Dashboard } from './components/Dashboard';
import { loginRequest, registerRequest, logoutRequest, meRequest, updateUserPassword, ApiUser } from '../lib/api';

const TOKEN_KEY = 'urbangreen_token';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // On app load, check if a saved token is still valid
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCheckingSession(false);
      return;
    }

    meRequest()
      .then((res) => {
        setCurrentUser(res.data);
        setIsLoggedIn(true);
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await loginRequest(email, password);
      sessionStorage.setItem(TOKEN_KEY, res.data.token);
      setCurrentUser(res.data.user);
      setIsLoggedIn(true);
      toast.success('Logged in successfully');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid email or password';
      toast.error(message);
    }
  };

const handleRegister = async (email: string, password: string, name: string, role: string) => {
    try {
      const res = await registerRequest(name, email, password, password, role);
      sessionStorage.setItem(TOKEN_KEY, res.data.token);
      setCurrentUser(res.data.user);
      setIsLoggedIn(true);
      setShowRegister(false);
      toast.success('Account created successfully');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      toast.error(message);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // even if the request fails, log out locally
    }
    sessionStorage.removeItem(TOKEN_KEY);
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const handleForgotPassword = (_email: string, _newPassword: string): boolean => {
    toast.error('Password reset via email is not yet available.');
    return false;
  };

  const handleUpdatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      await updateUserPassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update password';
      toast.error(message);
      return false;
    }
  };

  if (checkingSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0F172A]">
        <div className="text-[#22C55E]">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
   <div className="min-h-screen w-full">
        {!isLoggedIn ? (
          showRecovery ? (
            <RecoverAdminPage onBackToLogin={() => { setShowRecovery(false); window.location.hash = ''; }} />
          ) : showRegister ? (
            <RegisterPage onRegister={handleRegister} onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
                       <LoginPage
              onLogin={handleLogin}
              onSwitchToRegister={() => setShowRegister(true)}
              onForgotPassword={handleForgotPassword}
              onRecoverAdmin={() => setShowRecovery(true)}
            />
          )
        ) : (
          <Dashboard
            onLogout={handleLogout}
            currentUser={currentUser}
            onUpdatePassword={handleUpdatePassword}
          />
        )}
      </div>
    </>
  );
}