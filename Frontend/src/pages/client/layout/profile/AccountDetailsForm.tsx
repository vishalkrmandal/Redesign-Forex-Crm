import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Building2, CreditCard, Hash, Code2, Save, Loader2, ShieldCheck } from 'lucide-react';
import OTPVerification from './OTPVerification';

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
  { name: 'bankName' as const, label: 'Bank Name', placeholder: 'e.g. HDFC Bank', icon: Building2, color: '#6366f1', hint: 'Full name of your bank' },
  { name: 'accountHolderName' as const, label: 'Account Holder Name', placeholder: 'Full legal name', icon: CreditCard, color: '#10b981', hint: 'Name as on bank records' },
  { name: 'accountNumber' as const, label: 'Account Number', placeholder: 'Enter account number', icon: Hash, color: '#f59e0b', hint: 'Minimum 8 digits' },
  { name: 'ifscSwiftCode' as const, label: 'IFSC / SWIFT Code', placeholder: 'e.g. HDFC0001234', icon: Code2, color: '#ec4899', hint: 'Bank routing code' },
];

const AccountDetailsForm: React.FC<AccountDetailsFormProps> = ({ initialData, setProfileData }) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!formData.bankName?.trim()) errors.push('Please enter the bank name');
    if (!formData.accountHolderName?.trim()) errors.push('Please enter the account holder name');
    if (!formData.accountNumber?.trim()) errors.push('Please enter the account number');
    else if (formData.accountNumber.length < 8) errors.push('Account number must be at least 8 characters');
    if (!formData.ifscSwiftCode?.trim()) errors.push('Please enter the IFSC/SWIFT code');
    else if (formData.ifscSwiftCode.length < 8) errors.push('IFSC/SWIFT code must be at least 8 characters');
    if (errors.length > 0) { errors.forEach(err => toast.error(err)); return; }
    setPendingFormData(formData);
    setOtpDialogOpen(true);
  };

  const handleOTPVerified = async () => {
    if (!pendingFormData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      const sessionId = sessionStorage.getItem('sessionId');
      const sessionToken = sessionStorage.getItem('sessionToken');
      if (!token) { toast.error("Please login to update your account details"); return; }

      const response = await axios.post(`${API_BASE_URL}/api/profile/account-details`, pendingFormData, {
        headers: { Authorization: `Bearer ${token}`, 'x-session-id': sessionId || '', 'x-session-token': sessionToken || '' }
      });

      if (response.data.success) {
        toast.success("Bank details updated. Pending KYC verification.");
        setProfileData((prev: { bankDetails?: typeof formData }) => ({ ...prev, bankDetails: pendingFormData }));
      }
    } catch {
      toast.error("Failed to update account details");
    } finally {
      setLoading(false);
    }
  };

  const allFilled = FIELDS.every(f => !!formData[f.name]?.trim());

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">

        {/* Bank Card Visual */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-5"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)', minHeight: 140 }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
          <div className="absolute -right-5 top-10 w-24 h-24 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{formData.bankName || 'Bank Name'}</p>
                <p className="text-white/50 text-[10px]">Banking Details</p>
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-white/40" />
          </div>
          <div>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Account Number</p>
            <p className="text-white font-mono text-base tracking-widest">
              {formData.accountNumber ? `•••• •••• ${String(formData.accountNumber).slice(-4)}` : '•••• •••• ••••'}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-6">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">Holder</p>
              <p className="text-white/80 text-xs font-semibold">{formData.accountHolderName || '—'}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">IFSC/SWIFT</p>
              <p className="text-white/80 text-xs font-mono">{formData.ifscSwiftCode || '—'}</p>
            </div>
          </div>
        </motion.div>

        {/* Form Fields */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--theme-border)' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <Building2 className="w-4 h-4" style={{ color: '#6366f1' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>Bank Account Details</p>
              <p className="text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>Required for withdrawals via bank transfer</p>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.map(({ name, label, placeholder, icon: Icon, color, hint }) => {
              const isFocused = focusedField === name;
              const hasValue = !!formData[name]?.trim();
              return (
                <motion.div key={name} whileHover={{ y: -1 }}>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--theme-text-disabled)' }}>{label}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Icon className="w-4 h-4 transition-colors" style={{ color: isFocused ? color : 'var(--theme-text-disabled)' }} />
                    </div>
                    <input name={name} type="text" value={formData[name] || ''} onChange={handleChange}
                      placeholder={placeholder} required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: 'var(--theme-bg-main)',
                        border: `1.5px solid ${isFocused ? color : hasValue ? `${color}50` : 'var(--theme-border)'}`,
                        color: 'var(--theme-text-primary)'
                      }}
                      onFocus={() => setFocusedField(name)}
                      onBlur={() => setFocusedField(null)} />
                  </div>
                  <p className="text-[10px] mt-1 ml-1" style={{ color: 'var(--theme-text-disabled)' }}>{hint}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl px-5 py-4"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <p className="text-xs text-center sm:text-left" style={{ color: 'var(--theme-text-muted)' }}>
            Changes require OTP verification and admin KYC approval.
          </p>
          <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading || !allFilled}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save & Verify</>}
          </motion.button>
        </motion.div>
      </div>

      {/* OTP Dialog */}
      <OTPVerification open={otpDialogOpen} onOpenChange={setOtpDialogOpen}
        updateType="accountDetails" formData={pendingFormData} onVerified={handleOTPVerified} />
    </form>
  );
};

export default AccountDetailsForm;
