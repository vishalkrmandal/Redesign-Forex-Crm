// Frontend/src/pages/auth/sign-in/SignUp.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye, EyeOff, User, Mail, Lock, Globe, Phone, Calendar,
  Check, ChevronLeft, Shield, Gift, TrendingUp, UserCheck, Send
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import LocationSelector from "@/components/ui/location-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const sanitizeName = (s: string) => escapeHtml(s).replace(/[^a-zA-Z\s'\-]/g,'').trim().slice(0,50);

const formSchema = z.object({
  firstname: z.string().min(1,'First name required').max(50).regex(/^[a-zA-Z\s'-]+$/,'Letters only'),
  lastname:  z.string().min(1,'Last name required').max(50).regex(/^[a-zA-Z\s'-]+$/,'Letters only'),
  country:   z.tuple([z.string(), z.string().optional()]),
  phone:     z.string().min(10,'Enter valid phone').regex(/^[\d\s\-\+\(\)]+$/,'Invalid phone'),
  dateofbirth: z.date({ required_error: 'Date of birth required' }),
  email:     z.string().email('Invalid email').max(254),
  password:  z.string().min(8,'Min 8 chars').max(32).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,'Must contain uppercase, lowercase and number'),
  confirmPassword: z.string().min(8).max(32),
  referralCode: z.string().max(20).regex(/^[a-zA-Z0-9]*$/,'Invalid code').optional(),
}).refine(d => d.password === d.confirmPassword, { message:"Passwords don't match", path:['confirmPassword'] });

interface SignUpProps {
  validReferral?: { code: string; userName: string; preValidated: boolean };
}

const PERKS = [
  { icon: TrendingUp, text: 'Access live MT5 trading accounts' },
  { icon: Shield,     text: 'Regulated & secure platform' },
  { icon: Gift,       text: 'Referral bonuses & rewards' },
  { icon: UserCheck,  text: 'Verified KYC & fast onboarding' },
];

export default function SignUp({ validReferral }: SignUpProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryName, setCountryName] = useState('');
  const [stateName, setStateName] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstname: '', lastname: '', phone: '', email: '',
      password: '', confirmPassword: '',
      dateofbirth: new Date(),
      referralCode: validReferral?.code || '',
    },
  });

  useEffect(() => {
    if (validReferral?.preValidated) form.setValue('referralCode', validReferral.code);
  }, [validReferral, form]);

  const startTimer = () => {
    setResendTimer(60);
    setShowResend(false);
    const t = setInterval(() => setResendTimer(p => { if (p <= 1) { setShowResend(true); clearInterval(t); return 0; } return p - 1; }), 1000);
  };

  const startVerificationCheck = (email: string) => {
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/auth/check-verification-status`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ email: escapeHtml(email.toLowerCase().trim()) }),
        });
        const d = await r.json();
        if (d.isVerified) { clearInterval(iv); toast.success('Email verified! Redirecting…'); setTimeout(() => navigate('/?verified=true'), 2500); }
      } catch { /* silent */ }
    }, 5000);
    setTimeout(() => clearInterval(iv), 600000);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          firstname: sanitizeName(values.firstname),
          lastname:  sanitizeName(values.lastname),
          email:     escapeHtml(values.email.toLowerCase().trim()),
          phone:     values.phone.replace(/[^\d\+\-\s\(\)]/g,''),
          password:  values.password,
          country:   [sanitizeName(countryName), sanitizeName(stateName)],
          referralCode: values.referralCode ? values.referralCode.replace(/[^a-zA-Z0-9]/g,'') : undefined,
          dateofbirth: values.dateofbirth,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUserEmail(values.email);
        setRegistrationSuccess(true);
        startTimer();
        startVerificationCheck(values.email);
        toast.success('Account created! Check your email to verify.', { duration: 5000 });
        form.reset();
      } else {
        toast.error(data.message || 'Registration failed.');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendEmail = async () => {
    setIsResending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: escapeHtml(userEmail.toLowerCase().trim()) }),
      });
      const data = await res.json();
      if (data.success) { toast.success('Verification email resent!'); startTimer(); }
      else toast.error(data.message || 'Failed to resend.');
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setIsResending(false);
    }
  };

  const errStyle = { fontSize: 11, color: '#ef4444', marginTop: 4 };
  const labelStyle = { display: 'block' as const, fontSize: 12, fontWeight: 600 as const, color: 'var(--theme-text-muted)', marginBottom: 6 };
  const inputStyle = (hasLeft = false): React.CSSProperties => ({
    width: '100%', height: 44, borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    background: 'var(--theme-bg-main)', border: '1.5px solid var(--theme-border)',
    color: 'var(--theme-text-primary)', paddingLeft: hasLeft ? 40 : 12, paddingRight: 12, transition: 'border-color 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:flex-col lg:justify-between"
        style={{
          width: 320, flexShrink: 0, padding: '40px 32px',
          background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 55%, #24243e 100%)',
          position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(99,102,241,0.12)', filter:'blur(50px)', pointerEvents:'none' }} />

        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
            <img src="/favicon.png" alt="Logo" style={{ width:40, height:40, objectFit:'contain', borderRadius:8 }} />
            <p style={{ color:'white', fontWeight:800, fontSize:16, margin:0 }}>OXOTrade</p>
          </div>

          <h2 style={{ color:'white', fontSize:26, fontWeight:900, lineHeight:1.2, marginBottom:12 }}>
            Start your<br />
            <span style={{ background:'linear-gradient(90deg,#a5b4fc,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              trading journey
            </span>
          </h2>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, lineHeight:1.7, marginBottom:32 }}>
            Join thousands of traders worldwide and take control of your financial future.
          </p>

          {PERKS.map(p => (
            <div key={p.text} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <p.icon style={{ width:14, height:14, color:'#a5b4fc' }} />
              </div>
              <p style={{ color:'rgba(255,255,255,0.65)', fontSize:12, margin:0 }}>{p.text}</p>
            </div>
          ))}
        </div>

        <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11 }}>© {new Date().getFullYear()} OXOTrade</p>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────────── */}
      <div style={{ flex:1, background:'var(--theme-bg-main)', overflowY:'auto' }}>
        <div style={{ maxWidth:580, margin:'0 auto', padding:'40px 24px 60px' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
            <button
              onClick={() => navigate('/')}
              style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--theme-text-muted)', background:'none', border:'none', cursor:'pointer', padding:0 }}
            >
              <ChevronLeft style={{ width:15, height:15 }} /> Back to Login
            </button>
          </div>

          <h1 style={{ fontSize:26, fontWeight:900, color:'var(--theme-text-primary)', margin:0, marginBottom:6 }}>Create Account</h1>
          <p style={{ fontSize:13, color:'var(--theme-text-muted)', marginBottom:28 }}>
            {validReferral?.preValidated && validReferral.userName
              ? `Referred by ${escapeHtml(validReferral.userName)} — referral bonus will be applied`
              : 'Fill in your details to get started'}
          </p>

          {/* Referral banner */}
          {validReferral?.preValidated && (
            <div style={{ padding:'10px 14px', borderRadius:10, marginBottom:24, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', display:'flex', alignItems:'center', gap:10 }}>
              <Gift style={{ width:16, height:16, color:'#10b981', flexShrink:0 }} />
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:'#10b981', margin:0 }}>Valid Referral Code!</p>
                <p style={{ fontSize:11, color:'var(--theme-text-muted)', margin:0 }}>Referred by {escapeHtml(validReferral.userName)}</p>
              </div>
            </div>
          )}

          {/* Success state */}
          <AnimatePresence>
            {registrationSuccess && (
              <motion.div
                initial={{ opacity:0, y:-10 }}
                animate={{ opacity:1, y:0 }}
                style={{ padding:24, borderRadius:16, marginBottom:24, textAlign:'center', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)' }}
              >
                <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(16,185,129,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <Send style={{ width:24, height:24, color:'#10b981' }} />
                </div>
                <h3 style={{ fontSize:18, fontWeight:800, color:'var(--theme-text-primary)', marginBottom:6 }}>Verify your email</h3>
                <p style={{ fontSize:13, color:'var(--theme-text-muted)', marginBottom:16 }}>
                  We sent a verification link to <strong>{userEmail}</strong>. Check your inbox.
                </p>
                {!showResend && resendTimer > 0 && (
                  <p style={{ fontSize:12, color:'var(--theme-text-disabled)' }}>Resend in {resendTimer}s</p>
                )}
                {showResend && (
                  <button
                    onClick={resendEmail}
                    disabled={isResending}
                    style={{ padding:'8px 18px', borderRadius:10, border:'1px solid rgba(99,102,241,0.3)', background:'rgba(99,102,241,0.1)', color:'#6366f1', fontSize:13, fontWeight:600, cursor:'pointer' }}
                  >
                    {isResending ? 'Sending…' : 'Resend Verification Email'}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ display:'flex', flexDirection:'column', gap:18 }}>

            {/* Section: Personal */}
            <div>
              <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, color:'var(--theme-text-disabled)', marginBottom:12 }}>Personal Information</p>
              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label style={labelStyle}>First Name</label>
                  <div style={{ position:'relative' }}>
                    <User style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'var(--theme-text-disabled)' }} />
                    <input type="text" placeholder="First name" {...form.register('firstname')} style={inputStyle(true)}
                      onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='var(--theme-border)'} />
                  </div>
                  {form.formState.errors.firstname && <p style={errStyle}>{form.formState.errors.firstname.message}</p>}
                </div>
                {/* Last Name */}
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <div style={{ position:'relative' }}>
                    <User style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'var(--theme-text-disabled)' }} />
                    <input type="text" placeholder="Last name" {...form.register('lastname')} style={inputStyle(true)}
                      onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='var(--theme-border)'} />
                  </div>
                  {form.formState.errors.lastname && <p style={errStyle}>{form.formState.errors.lastname.message}</p>}
                </div>
              </div>
            </div>

            {/* Country */}
            <div>
              <label style={labelStyle}>Country / State</label>
              <div style={{ border:'1.5px solid var(--theme-border)', borderRadius:10, overflow:'hidden', background:'var(--theme-bg-main)' }}>
                <LocationSelector
                  onCountryChange={(c) => { setCountryName(c?.name||''); form.setValue('country', [c?.name||'', stateName||'']); }}
                  onStateChange={(s) => { setStateName(s?.name||''); form.setValue('country', [countryName||'', s?.name||'']); }}
                />
              </div>
              {form.formState.errors.country && <p style={errStyle}>Country is required</p>}
            </div>

            {/* Phone + DOB */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Phone Number</label>
                <PhoneInput
                  placeholder="Enter phone"
                  defaultCountry="IN"
                  {...form.register('phone')}
                  style={{ height: 44, fontSize: 13 }}
                />
                {form.formState.errors.phone && <p style={errStyle}>{form.formState.errors.phone.message}</p>}
              </div>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <DatePicker
                  value={form.watch('dateofbirth')}
                  onChange={(d) => form.setValue('dateofbirth', d!)}
                  className="w-full h-11 text-sm"
                />
                {form.formState.errors.dateofbirth && <p style={errStyle}>{form.formState.errors.dateofbirth.message}</p>}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height:1, background:'var(--theme-border)' }} />
            <p style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, color:'var(--theme-text-disabled)', marginTop:-6 }}>Account Details</p>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position:'relative' }}>
                <Mail style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'var(--theme-text-disabled)' }} />
                <input type="email" placeholder="your@email.com" {...form.register('email')} style={inputStyle(true)}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='var(--theme-border)'} />
              </div>
              {form.formState.errors.email && <p style={errStyle}>{form.formState.errors.email.message}</p>}
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position:'relative' }}>
                  <Lock style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'var(--theme-text-disabled)' }} />
                  <input type={showPassword?'text':'password'} placeholder="Min 8 characters" {...form.register('password')}
                    style={{ ...inputStyle(true), paddingRight:40 }}
                    onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='var(--theme-border)'} />
                  <button type="button" onClick={()=>setShowPassword(!showPassword)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--theme-text-muted)' }}>
                    {showPassword ? <EyeOff style={{ width:14, height:14 }} /> : <Eye style={{ width:14, height:14 }} />}
                  </button>
                </div>
                {form.formState.errors.password && <p style={errStyle}>{form.formState.errors.password.message}</p>}
              </div>
              {/* Confirm Password */}
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <div style={{ position:'relative' }}>
                  <Lock style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:14, height:14, color:'var(--theme-text-disabled)' }} />
                  <input type={showConfirmPassword?'text':'password'} placeholder="Repeat password" {...form.register('confirmPassword')}
                    style={{ ...inputStyle(true), paddingRight:40 }}
                    onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='var(--theme-border)'} />
                  <button type="button" onClick={()=>setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--theme-text-muted)' }}>
                    {showConfirmPassword ? <EyeOff style={{ width:14, height:14 }} /> : <Eye style={{ width:14, height:14 }} />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && <p style={errStyle}>{form.formState.errors.confirmPassword.message}</p>}
              </div>
            </div>

            {/* Referral code (if not pre-validated) */}
            {!validReferral?.preValidated && (
              <div>
                <label style={labelStyle}>Referral Code <span style={{ fontWeight:400, color:'var(--theme-text-disabled)' }}>(optional)</span></label>
                <input type="text" placeholder="Enter referral code" {...form.register('referralCode')} style={inputStyle()}
                  onFocus={e=>e.target.style.borderColor='#6366f1'} onBlur={e=>e.target.style.borderColor='var(--theme-border)'} />
                {form.formState.errors.referralCode && <p style={errStyle}>{form.formState.errors.referralCode.message}</p>}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height:48, borderRadius:12, border:'none', cursor:'pointer', marginTop:6,
                background:'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color:'white', fontSize:14, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                opacity: isSubmitting ? 0.75 : 1, boxShadow:'0 4px 20px rgba(99,102,241,0.3)',
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{ width:15, height:15, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
                  Creating account…
                </>
              ) : (
                <>
                  <Check style={{ width:16, height:16 }} />
                  Create Account
                </>
              )}
            </button>

            <p style={{ textAlign:'center', fontSize:13, color:'var(--theme-text-muted)' }}>
              Already have an account?{' '}
              <button type="button" onClick={()=>navigate('/')}
                style={{ fontWeight:700, color:'#6366f1', background:'none', border:'none', cursor:'pointer', padding:0 }}>
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
