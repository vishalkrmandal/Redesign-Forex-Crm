// Frontend/src/pages/client/layout/profile/AccountDetailsForm.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Building2, User, Hash, Code2, Save, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface AccountDetailsFormProps {
  initialData: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscSwiftCode?: string;
  };
  setProfileData: React.Dispatch<React.SetStateAction<any>>;
}

const FIELDS = [
  {
    key: 'bankName',
    label: 'Name of Bank',
    placeholder: 'e.g. State Bank of India',
    icon: Building2,
    color: '#6366f1',
    hint: 'Enter the full official name of your bank',
  },
  {
    key: 'accountHolderName',
    label: 'Account Holder Name',
    placeholder: 'Full name as on bank account',
    icon: User,
    color: '#10b981',
    hint: 'Must match exactly as on your bank records',
  },
  {
    key: 'accountNumber',
    label: 'Account Number',
    placeholder: 'Enter your bank account number',
    icon: Hash,
    color: '#f59e0b',
    hint: 'Double-check for accuracy',
  },
  {
    key: 'ifscSwiftCode',
    label: 'IFSC / SWIFT Code',
    placeholder: 'e.g. SBIN0001234 or SBININBBXXX',
    icon: Code2,
    color: '#8b5cf6',
    hint: 'Used for domestic (IFSC) or international (SWIFT) transfers',
  },
];

const SectionHead = ({ color, label }: { color: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
    <div style={{ width: 4, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
      {label}
    </span>
  </div>
);

const AccountDetailsForm: React.FC<AccountDetailsFormProps> = ({ initialData, setProfileData }) => {
  const [formData, setFormData] = useState({
    bankName: initialData.bankName || '',
    accountHolderName: initialData.accountHolderName || '',
    accountNumber: initialData.accountNumber || '',
    ifscSwiftCode: initialData.ifscSwiftCode || '',
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFormData({
      bankName: initialData.bankName || '',
      accountHolderName: initialData.accountHolderName || '',
      accountNumber: initialData.accountNumber || '',
      ifscSwiftCode: initialData.ifscSwiftCode || '',
    });
  }, [initialData]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      if (!token) { toast.error('Please login to update your account details'); return; }
      const res = await axios.post(`${API_BASE_URL}/api/profile/account-details`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        toast.success('Bank details updated successfully');
        setSaved(true);
        setProfileData((prev: any) => ({ ...prev, bankDetails: formData }));
      }
    } catch {
      toast.error('Failed to update account details');
    } finally {
      setLoading(false);
    }
  };

  const hasData = Object.values(formData).some(v => v.trim() !== '');

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Security Notice ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', borderRadius: 12, marginBottom: 24,
        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)',
      }}>
        <ShieldCheck style={{ width: 18, height: 18, color: '#6366f1', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#6366f1', margin: '0 0 2px' }}>
            Secure Banking Information
          </p>
          <p style={{ fontSize: 12, color: 'var(--theme-text-muted)', margin: 0, lineHeight: 1.5 }}>
            Your bank details are encrypted and used only for withdrawal processing. We never share this information with third parties.
          </p>
        </div>
      </div>

      {/* ── Bank Details Card ──────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--theme-bg-card)', borderRadius: 16,
        border: '1px solid var(--theme-border)', padding: 24, marginBottom: 20,
      }}>
        <SectionHead color="#6366f1" label="Bank Account Details" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {FIELDS.map(field => {
            const Icon = field.icon;
            const isFocused = focusedField === field.key;
            const hasValue = (formData as any)[field.key]?.trim() !== '';

            return (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label style={{ display: 'block', marginBottom: 6 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: isFocused ? field.color : 'var(--theme-text-muted)',
                    transition: 'color 0.15s',
                  }}>
                    {field.label}
                  </span>
                </label>

                {/* Input wrapper */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  borderRadius: 12, overflow: 'hidden',
                  border: `1.5px solid ${isFocused ? field.color : hasValue ? 'rgba(99,102,241,0.3)' : 'var(--theme-border)'}`,
                  background: 'var(--theme-bg-main)',
                  transition: 'border-color 0.15s',
                  boxShadow: isFocused ? `0 0 0 3px ${field.color}18` : 'none',
                }}>
                  {/* Icon prefix */}
                  <div style={{
                    width: 44, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isFocused ? `${field.color}12` : 'transparent',
                    borderRight: `1px solid ${isFocused ? field.color + '30' : 'var(--theme-border)'}`,
                    transition: 'all 0.15s', flexShrink: 0,
                  }}>
                    <Icon style={{ width: 16, height: 16, color: isFocused ? field.color : 'var(--theme-text-disabled)' }} />
                  </div>

                  <input
                    type="text"
                    value={(formData as any)[field.key]}
                    onChange={e => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    onFocus={() => setFocusedField(field.key)}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      flex: 1, height: 46, paddingLeft: 14, paddingRight: 14, border: 'none',
                      outline: 'none', fontSize: 14, background: 'transparent',
                      color: 'var(--theme-text-primary)',
                    }}
                  />

                  {/* Filled indicator */}
                  {hasValue && (
                    <div style={{ paddingRight: 12, flexShrink: 0 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: field.color }} />
                    </div>
                  )}
                </div>

                {/* Hint text */}
                <p style={{ fontSize: 11, color: 'var(--theme-text-disabled)', margin: '4px 0 0', paddingLeft: 2 }}>
                  {field.hint}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Completeness indicator ─────────────────────────────────────────── */}
      {(() => {
        const filled = Object.values(formData).filter(v => v.trim() !== '').length;
        const total = 4;
        const pct = Math.round((filled / total) * 100);
        return (
          <div style={{
            background: 'var(--theme-bg-card)', borderRadius: 12,
            border: '1px solid var(--theme-border)', padding: '14px 18px',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <AlertCircle style={{ width: 15, height: 15, color: filled < total ? '#f59e0b' : '#10b981', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--theme-text-muted)', fontWeight: 600 }}>
                  {filled < total ? `${total - filled} field${total - filled > 1 ? 's' : ''} remaining` : 'All fields completed'}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: filled < total ? '#f59e0b' : '#10b981' }}>{pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'var(--theme-border)', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 2, background: filled < total ? '#f59e0b' : '#10b981' }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Actions ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={loading || !hasData}
          style={{
            height: 46, paddingLeft: 28, paddingRight: 28, borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: loading || !hasData ? 0.7 : 1,
            transition: 'all 0.2s',
            boxShadow: loading || !hasData ? 'none' : saved ? '0 4px 16px rgba(16,185,129,0.35)' : '0 4px 16px rgba(99,102,241,0.35)',
          }}
        >
          {loading ? (
            <>
              <div style={{ width: 15, height: 15, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Saving…
            </>
          ) : (
            <>
              <Save style={{ width: 15, height: 15 }} />
              {saved ? 'Saved!' : 'Save Bank Details'}
            </>
          )}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
};

export default AccountDetailsForm;
