// Frontend/src/pages/auth/sign-in/components/SignInCard.tsx
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Eye, EyeOff, LogIn, UserPlus, Shield, Users, Crown, X, UserCheck,
  TrendingUp, BarChart2, Globe, ChevronRight, Mail, Lock
} from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import ForgotPassword from './ForgotPassword';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3210';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
});

const ROLE_CONFIG = {
  client: { label: 'Client', icon: Users, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', accent: '#6366f1', path: '/' },
  admin: { label: 'Admin', icon: Shield, gradient: 'linear-gradient(135deg, #10b981, #06b6d4)', accent: '#10b981', path: '/login/admin' },
  superadmin: { label: 'Super Admin', icon: Crown, gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)', accent: '#f59e0b', path: '/login/superadmin' },
  agent: { label: 'Agent', icon: UserPlus, gradient: 'linear-gradient(135deg, #ec4899, #f97316)', accent: '#ec4899', path: '/login/agent' },
};

const ROLE_VISIBILITY: Record<string, string[]> = {
  client: ['client'],
  agent: ['agent'],
  admin: ['client', 'admin'],
  superadmin: ['client', 'agent', 'admin', 'superadmin'],
};

const BENEFITS = [
  { icon: TrendingUp, title: 'Real-time Trading', desc: 'Monitor live MT5 positions and market data' },
  { icon: BarChart2, title: 'Portfolio Analytics', desc: 'Track performance across all accounts' },
  { icon: Globe, title: 'Multi-market Access', desc: 'Forex, indices, commodities, crypto' },
];

interface SignInCardProps {
  loginType?: 'client' | 'admin' | 'superadmin' | 'agent';
}

export default function SignInCard({ loginType = 'client' }: SignInCardProps) {
  const { getAllActiveSessions, hasValidSession } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [showExistingSession, setShowExistingSession] = React.useState(false);

  const role = ROLE_CONFIG[loginType];
  const activeSessions = getAllActiveSessions();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem(`rememberedEmail_${loginType}`) || '',
      password: '',
      rememberMe: !!localStorage.getItem(`rememberedEmail_${loginType}`),
    },
  });

  React.useEffect(() => {
    const token = localStorage.getItem(`${loginType}Token`);
    const userStr = localStorage.getItem(`${loginType}User`);
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user?.role === loginType) setShowExistingSession(true);
      } catch {
        localStorage.removeItem(`${loginType}Token`);
        localStorage.removeItem(`${loginType}User`);
      }
    }
  }, [loginType]);

  const handleUseExistingSession = () => {
    const paths: Record<string, string> = {
      client: '/client/dashboard', admin: '/admin/dashboard',
      agent: '/agent/dashboard', superadmin: '/superadmin/configure',
    };
    navigate(paths[loginType]);
  };

  const handleLoginAsNewUser = () => {
    localStorage.removeItem(`${loginType}Token`);
    localStorage.removeItem(`${loginType}User`);
    setShowExistingSession(false);
    toast.info('Previous session cleared.');
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, password: values.password, loginType }),
      });
      const data = await response.json();

      if (data.success) {
        const userRole = data.user.role;
        if (userRole !== loginType) {
          const correctPath = userRole === 'client' ? '/' : `/login/${userRole}`;
          toast.error(`Wrong portal. Please use ${correctPath}`);
          setTimeout(() => navigate(correctPath), 2000);
          setIsSubmitting(false);
          return;
        }

        // Remember Me
        if (values.rememberMe) {
          localStorage.setItem(`rememberedEmail_${loginType}`, values.email);
        } else {
          localStorage.removeItem(`rememberedEmail_${loginType}`);
        }

        localStorage.setItem(`${userRole}Token`, data.token);
        localStorage.setItem(`${userRole}User`, JSON.stringify(data.user));

        if (data.user.isEmailVerified) {
          toast.success('Login successful! Redirecting…');
          setTimeout(() => {
            const redirectMap: Record<string, string> = {
              superadmin: '/superadmin/configure', agent: '/agent/dashboard',
              admin: '/admin/dashboard', client: '/client/dashboard',
            };
            window.location.href = redirectMap[userRole];
          }, 800);
        } else {
          toast.error('Please verify your email address first.');
        }
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleRoles = ROLE_VISIBILITY[loginType];
  const existingUser = (() => {
    try { return JSON.parse(localStorage.getItem(`${loginType}User`) || 'null'); } catch { return null; }
  })();

  return (
    <>
      <div style={{
        position: 'fixed', inset: 0, display: 'flex',
        background: 'var(--theme-bg-main)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
        <div
          className="hidden lg:flex lg:flex-col lg:justify-between"
          style={{
            width: '42%', flexShrink: 0, padding: '48px 40px',
            background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 55%, #24243e 100%)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Decorative orbs */}
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', filter: 'blur(50px)', pointerEvents: 'none' }} />

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
              <img src="/favicon.png" alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 10 }} />
              <div>
                <p style={{ color: 'white', fontWeight: 800, fontSize: 18, lineHeight: 1, margin: 0 }}>OXOTrade</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>Professional Trading Platform</p>
              </div>
            </div>

            <h1 style={{ color: 'white', fontSize: 32, fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>
              Trade smarter,<br />
              <span style={{ background: 'linear-gradient(90deg,#a5b4fc,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                earn better
              </span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, marginBottom: 40, maxWidth: 320 }}>
              Access real-time markets, manage your portfolio, and grow your investments with confidence.
            </p>

            {/* Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {BENEFITS.map(b => (
                <div key={b.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <b.icon style={{ width: 16, height: 16, color: '#a5b4fc' }} />
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 13, margin: 0, marginBottom: 2 }}>{b.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin: 0 }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
            © {new Date().getFullYear()} OXOTrade. Secure platform.
          </p>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '32px 24px',
        }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Mobile logo */}
            <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <img src="/favicon.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
              <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--theme-text-primary)', margin: 0 }}>OXOTrade</p>
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--theme-text-primary)', margin: 0, marginBottom: 6 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', marginBottom: 28 }}>
              Sign in to your {ROLE_CONFIG[loginType].label.toLowerCase()} account
            </p>

            {/* Role switcher */}
            {visibleRoles.length > 1 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
                {Object.entries(ROLE_CONFIG)
                  .filter(([r]) => visibleRoles.includes(r))
                  .map(([r, cfg]) => {
                    const active = loginType === r;
                    const has = hasValidSession(r);
                    return (
                      <button
                        key={r}
                        onClick={() => navigate(cfg.path)}
                        style={{
                          position: 'relative', display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                          fontSize: 12, fontWeight: 600,
                          background: active ? cfg.gradient : 'var(--theme-bg-card)',
                          color: active ? 'white' : 'var(--theme-text-muted)',
                          border: active ? 'none' : '1px solid var(--theme-border)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <cfg.icon style={{ width: 11, height: 11 }} />
                        {cfg.label}
                        {has && !active && (
                          <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: '50%', background: '#10b981', border: '2px solid var(--theme-bg-card)' }} />
                        )}
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Existing session banner */}
            {showExistingSession && existingUser && (
              <div style={{
                padding: 14, borderRadius: 12, marginBottom: 20,
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <UserCheck style={{ width: 16, height: 16, color: '#6366f1' }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)', margin: 0 }}>
                    Logged in as {existingUser.firstname} {existingUser.lastname}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleUseExistingSession}
                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: '#6366f1', color: 'white' }}
                  >Continue</button>
                  <button
                    onClick={handleLoginAsNewUser}
                    style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'var(--theme-bg-card)', color: 'var(--theme-text-primary)', border: '1px solid var(--theme-border)' }}
                  >Switch Account</button>
                  <button
                    onClick={() => { localStorage.removeItem(`${loginType}Token`); localStorage.removeItem(`${loginType}User`); setShowExistingSession(false); }}
                    style={{ padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    <X style={{ width: 11, height: 11, display: 'inline', marginRight: 4 }} />
                    Logout
                  </button>
                </div>
              </div>
            )}

            {/* Other active sessions */}
            {activeSessions.filter(s => s !== loginType).length > 0 && (
              <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 16, fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                Other active: {activeSessions.filter(s => s !== loginType).join(', ')}
              </div>
            )}

            {/* Form */}
            {!showExistingSession && (
              <form onSubmit={form.handleSubmit(onSubmit)}>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--theme-text-disabled)' }} />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      {...form.register('email')}
                      style={{
                        width: '100%', height: 48, paddingLeft: 44, paddingRight: 16, borderRadius: 12,
                        fontSize: 14, outline: 'none', boxSizing: 'border-box',
                        background: 'var(--theme-bg-card)', border: '1.5px solid var(--theme-border)',
                        color: 'var(--theme-text-primary)', transition: 'border-color 0.15s',
                      }}
                      onFocus={e => e.target.style.borderColor = role.accent}
                      onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{form.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      style={{ fontSize: 12, fontWeight: 600, color: role.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--theme-text-disabled)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...form.register('password')}
                      style={{
                        width: '100%', height: 48, paddingLeft: 44, paddingRight: 48, borderRadius: 12,
                        fontSize: 14, outline: 'none', boxSizing: 'border-box',
                        background: 'var(--theme-bg-card)', border: '1.5px solid var(--theme-border)',
                        color: 'var(--theme-text-primary)', transition: 'border-color 0.15s',
                      }}
                      onFocus={e => e.target.style.borderColor = role.accent}
                      onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--theme-text-muted)' }}
                    >
                      {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{form.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Remember Me */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    {...form.register('rememberMe')}
                    style={{ width: 16, height: 16, accentColor: role.accent, cursor: 'pointer' }}
                  />
                  <label htmlFor="rememberMe" style={{ fontSize: 13, color: 'var(--theme-text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                    Remember me
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: '100%', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: role.gradient, color: 'white', fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: isSubmitting ? 0.75 : 1, transition: 'opacity 0.15s',
                    boxShadow: `0 4px 20px rgba(99,102,241,0.3)`,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn style={{ width: 16, height: 16 }} />
                      Sign in as {ROLE_CONFIG[loginType].label}
                    </>
                  )}
                </button>

                {/* Signup link */}
                {loginType === 'client' && (
                  <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <span style={{ fontSize: 13, color: 'var(--theme-text-muted)' }}>Don't have an account?{' '}</span>
                    <button
                      type="button"
                      onClick={() => navigate('/signup')}
                      style={{ fontSize: 13, fontWeight: 700, color: role.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Create account <ChevronRight style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <ForgotPassword open={showForgotPassword} handleClose={() => setShowForgotPassword(false)} />
    </>
  );
}
