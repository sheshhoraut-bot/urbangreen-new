import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Shield } from 'lucide-react';

interface RegisterPageProps {
  onRegister: (email: string, password: string, name: string, role: string) => void;
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('operator');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

 if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    onRegister(email, password, name, role);
  };

  return (
    <div className="h-screen flex">
      {/* Left Side - Register Form */}
      <div className="w-1/2 bg-background flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-20 h-20 bg-[#22C55E] rounded-lg flex items-center justify-center">
              <span className="text-white text-5xl">🌱</span>
            </div>
            <span className="text-[#22C55E] text-3xl tracking-wide">URBANGREEN+</span>
          </div>

          {/* Welcome Text */}
          <h2 className="text-foreground mb-2">Create Account</h2>
          <p className="text-muted-foreground mb-8">Join UrbanGreen+ and start your smart farming journey</p>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-foreground mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-foreground mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-12 pr-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
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

            {/* Confirm Password Input */}
            <div>
              <label className="block text-foreground mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full h-12 pl-12 pr-12 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>


           {/* Account Type */}
            <div>
              <label className="block text-foreground mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('operator')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    role === 'operator' ? 'border-[#22C55E] bg-[#22C55E]/5' : 'border-border'
                  }`}
                >
                  <User className="w-4 h-4 mb-1 text-[#22C55E]" />
                  <p className="text-foreground text-sm">Operator</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    role === 'admin' ? 'border-[#F59E0B] bg-[#F59E0B]/5' : 'border-border'
                  }`}
                >
                  <Shield className="w-4 h-4 mb-1 text-[#F59E0B]" />
                  <p className="text-foreground text-sm">Admin</p>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {/* Register Button */}
            <button
              type="submit"
              className="w-full h-12 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-all shadow-lg shadow-[#22C55E]/20"
            >
              Create Account
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-muted-foreground mt-8">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-[#22C55E] hover:text-[#16A34A]">
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Design/Image */}
      <div className="w-1/2 bg-background flex items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-[#22C55E]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-[#22C55E]/20 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          <div className="mb-6 text-8xl">🌱</div>
          <h2 className="text-[#22C55E] mb-4">Smart Urban Farming</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Monitor and control your urban farm with real-time data, automated systems, and intelligent insights for optimal plant growth.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <div className="px-4 py-2 bg-[#22C55E]/10 border border-[#22C55E] rounded-full text-[#22C55E]">
              Real-time Monitoring
            </div>
            <div className="px-4 py-2 bg-[#22C55E]/10 border border-[#22C55E] rounded-full text-[#22C55E]">
              Automated Control
            </div>
            <div className="px-4 py-2 bg-[#22C55E]/10 border border-[#22C55E] rounded-full text-[#22C55E]">
              Smart Analytics
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
