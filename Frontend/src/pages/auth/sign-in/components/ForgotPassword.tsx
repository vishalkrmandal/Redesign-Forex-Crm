// Frontend/src/pages/auth/sign-in/components/ForgotPassword.tsx
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Mail, X, CheckCircle, KeyRound, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export default function ForgotPassword({ open, handleClose }: ForgotPasswordProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);
  const [sentTo, setSentTo] = React.useState('');

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (data.success) {
        setSentTo(values.email);
        setEmailSent(true);
        toast.success('Password reset email sent!');
      } else {
        toast.error(data.message || 'Failed to send reset email');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    handleClose();
    setTimeout(() => { setEmailSent(false); setSentTo(''); form.reset(); }, 300);
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) handleDialogClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              width: '100%', maxWidth: 420,
              background: 'var(--theme-bg-card)',
              borderRadius: 20, overflow: 'hidden',
              border: '1px solid var(--theme-border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px 24px 20px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
              borderBottom: '1px solid var(--theme-border)',
              position: 'relative',
            }}>
              <button
                onClick={handleDialogClose}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 28, height: 28, borderRadius: 8, border: 'none',
                  background: 'var(--theme-border)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--theme-text-muted)',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>

              <div style={{
                width: 48, height: 48, borderRadius: 14, marginBottom: 14,
                background: emailSent ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${emailSent ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`,
              }}>
                {emailSent
                  ? <CheckCircle style={{ width: 22, height: 22, color: '#10b981' }} />
                  : <KeyRound style={{ width: 22, height: 22, color: '#6366f1' }} />
                }
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0, marginBottom: 4 }}>
                {emailSent ? 'Check your inbox' : 'Reset password'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: 0 }}>
                {emailSent
                  ? `We sent a reset link to ${sentTo}`
                  : "Enter your email and we'll send a reset link"
                }
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: 24 }}>
              <AnimatePresence mode="wait">
                {!emailSent ? (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    onSubmit={form.handleSubmit(onSubmit)}
                  >
                    <div style={{ marginBottom: 20 }}>
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
                            width: '100%', height: 46, paddingLeft: 44, paddingRight: 16, borderRadius: 12,
                            fontSize: 14, outline: 'none', boxSizing: 'border-box',
                            background: 'var(--theme-bg-main)', border: '1.5px solid var(--theme-border)',
                            color: 'var(--theme-text-primary)', transition: 'border-color 0.15s',
                          }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
                        />
                      </div>
                      {form.formState.errors.email && (
                        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={handleDialogClose}
                        style={{
                          flex: 1, height: 44, borderRadius: 12, cursor: 'pointer',
                          background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)',
                          color: 'var(--theme-text-muted)', fontSize: 13, fontWeight: 600,
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          flex: 1, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: 'white', fontSize: 13, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          opacity: isSubmitting ? 0.75 : 1,
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <div style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send style={{ width: 14, height: 14 }} />
                            Send Reset Link
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                  >
                    {/* Inbox visual cue */}
                    <div style={{
                      padding: 16, borderRadius: 12, marginBottom: 20, textAlign: 'center',
                      background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                    }}>
                      <Mail style={{ width: 32, height: 32, color: '#10b981', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 13, color: 'var(--theme-text-primary)', margin: 0, fontWeight: 600 }}>
                        Reset link sent!
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', margin: '4px 0 0' }}>
                        Check your spam folder if you don't see it.
                      </p>
                    </div>

                    <button
                      onClick={handleDialogClose}
                      style={{
                        width: '100%', height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', fontSize: 13, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <CheckCircle style={{ width: 15, height: 15 }} />
                      Got it, thanks!
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
