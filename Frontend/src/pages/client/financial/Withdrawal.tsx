// Frontend/src/pages/client/financial/Withdrawal.tsx
import { useState, useEffect, useRef } from "react";
import { Wallet, AlertCircle, Loader, CheckCircle2, Building2, Bitcoin, Shield, ChevronRight, ChevronDown, Copy, KeyRound, Mail, RefreshCw } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Account { _id: string; mt5Account: string; accountType: string; balance: number; name: string; }
interface BankDetails { bankName: string; accountHolderName: string; accountNumber: string; ifscCode: string; }
interface EWalletDetails { walletId: string; type: string; }
interface WithdrawalHistory { _id: string; createdAt: string; paymentMethod: string; amount: number; accountNumber: string; status: "Pending" | "Approved" | "Rejected"; }
interface PaymentMethod { paymentMethod: string; paymentDetails: BankDetails | EWalletDetails; }

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ steps, current }: { steps: string[]; current: number }) => (
  <div className="flex items-center w-full mb-6">
    {steps.map((label, i) => {
      const isDone = i < current;
      const isActive = i === current;
      return (
        <div key={i} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={{
                background: isDone ? '#10b981' : isActive ? 'var(--theme-primary)' : 'var(--theme-border)',
                color: isDone || isActive ? 'white' : 'var(--theme-text-muted)',
                boxShadow: isActive ? '0 0 0 4px color-mix(in srgb, var(--theme-primary) 20%, transparent)' : 'none'
              }}>
              {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-[10px] mt-1 font-medium whitespace-nowrap hidden sm:block"
              style={{ color: isActive ? 'var(--theme-primary)' : isDone ? '#10b981' : 'var(--theme-text-disabled)' }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-500"
              style={{ background: i < current ? '#10b981' : 'var(--theme-border)' }} />
          )}
        </div>
      );
    })}
  </div>
);

// ─── Step Wrapper ─────────────────────────────────────────────────────────────
const StepWrapper = ({ stepNum, current, title, summary, children }: {
  stepNum: number; current: number; title: string; summary?: string; children: React.ReactNode;
}) => {
  const isDone = stepNum < current;
  const isActive = stepNum === current;
  const isLocked = stepNum > current;

  return (
    <motion.div layout className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        border: `1px solid ${isActive ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
        backgroundColor: 'var(--theme-bg-card)',
        opacity: isLocked ? 0.5 : 1,
        boxShadow: isActive ? '0 0 0 2px color-mix(in srgb, var(--theme-primary) 15%, transparent)' : 'none'
      }}>
      <div className="flex items-center gap-3 p-4"
        style={{
          borderBottom: isActive ? '1px solid var(--theme-border)' : 'none',
          background: isDone ? '#10b98108' : isActive ? 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' : 'transparent'
        }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: isDone ? '#10b981' : isActive ? 'var(--theme-primary)' : 'var(--theme-border)',
            color: isDone || isActive ? 'white' : 'var(--theme-text-muted)'
          }}>
          {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{title}</p>
          {isDone && summary && <p className="text-xs truncate" style={{ color: '#10b981' }}>{summary}</p>}
          {isLocked && <p className="text-xs" style={{ color: 'var(--theme-text-disabled)' }}>Complete previous step first</p>}
        </div>
        {isDone && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
      </div>
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; text: string }> = {
    approved: { bg: '#10b98120', text: '#10b981' },
    rejected: { bg: '#ef444420', text: '#ef4444' },
    pending: { bg: '#f59e0b20', text: '#f59e0b' },
  };
  const c = cfg[status.toLowerCase()] || cfg.pending;
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.text }}>{status}</span>
  );
};

// ─── Inline Input ─────────────────────────────────────────────────────────────
const FormInput = ({ label, name, value, onChange, placeholder, readOnly = false, required = false }: {
  label: string; name: string; value: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; readOnly?: boolean; required?: boolean;
}) => (
  <div>
    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--theme-text-muted)' }}>{label}</label>
    <input
      name={name} value={value} onChange={onChange} placeholder={placeholder}
      readOnly={readOnly} required={required}
      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
      style={{
        background: readOnly ? 'var(--theme-bg-main)' : 'var(--theme-bg-main)',
        border: '1px solid var(--theme-border)',
        color: 'var(--theme-text-primary)',
        opacity: readOnly ? 0.7 : 1
      }}
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Withdrawal() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [method, setMethod] = useState("");
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([]);
  const [amount, setAmount] = useState("");
  const [lastPaymentMethod, setLastPaymentMethod] = useState<PaymentMethod | null>(null);
  const [step, setStep] = useState(0);
  const [eWalletType, setEWalletType] = useState("");
  const [isLoading, setIsLoading] = useState({ accounts: false, withdrawals: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasOpenTrades, setHasOpenTrades] = useState(false);
  const [profilePaymentMethods, setProfilePaymentMethods] = useState<any>(null);
  const [availableWallets, setAvailableWallets] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails>({ bankName: "", accountHolderName: "", accountNumber: "", ifscCode: "" });
  const [eWalletDetails, setEWalletDetails] = useState<EWalletDetails>({ walletId: "", type: "" });

  // OTP state
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpKey, setOtpKey] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getToken = () => localStorage.getItem("clientToken");
  const authHeaders = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

  const triggerBalanceUpdate = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const userData = JSON.parse(localStorage.getItem('clientUser') || '{}');
      if (!token || !userData.id) return;
      await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/users/${userData.id}/accounts`,
        { headers: { Authorization: `Bearer ${token}` } });
    } catch { /* silent */ }
  };

  useEffect(() => {
    triggerBalanceUpdate();
    setIsLoading(p => ({ ...p, accounts: true }));
    axios.get(`${API_BASE_URL}/api/accounts`, authHeaders())
      .then(res => {
        const data = res.data.data || [];
        setAccounts(data);
        if (data.length > 0) setSelectedAccount(data[0]._id);
      })
      .catch(() => { /* silent */ })
      .finally(() => setIsLoading(p => ({ ...p, accounts: false })));
  }, []);

  useEffect(() => {
    setIsLoading(p => ({ ...p, withdrawals: true }));
    axios.get(`${API_BASE_URL}/api/withdrawals/user`, authHeaders())
      .then(res => setWithdrawalHistory(res.data.data || []))
      .catch(() => { /* silent */ })
      .finally(() => setIsLoading(p => ({ ...p, withdrawals: false })));
  }, []);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/withdrawals/last-method`, authHeaders())
      .then(res => {
        if (res.data.data?.source === 'profile') {
          setProfilePaymentMethods(res.data.data.paymentMethods);
          const ewalletMethod = res.data.data.paymentMethods.find((m: any) => m.type === 'ewallet');
          if (ewalletMethod) setAvailableWallets(ewalletMethod.wallets);
        } else if (res.data.data) {
          setLastPaymentMethod(res.data.data);
        }
      })
      .catch(() => { /* silent */ });
  }, []);

  const selectedAccountDetails = accounts.find(a => a._id === selectedAccount);

  const selectPaymentMethod = (methodType: string) => {
    setMethod(methodType);
    if (profilePaymentMethods) {
      if (methodType === "bank") {
        const bankMethod = profilePaymentMethods.find((m: any) => m.type === 'bank');
        if (bankMethod) setBankDetails(bankMethod.details);
      }
    } else if (lastPaymentMethod?.paymentMethod === methodType) {
      if (methodType === "bank" && "bankName" in lastPaymentMethod.paymentDetails) {
        setBankDetails(lastPaymentMethod.paymentDetails as BankDetails);
      } else if (methodType === "ewallet" && "walletId" in lastPaymentMethod.paymentDetails) {
        setEWalletDetails({ ...(lastPaymentMethod.paymentDetails as EWalletDetails), type: (lastPaymentMethod.paymentDetails as any).type });
        setEWalletType((lastPaymentMethod.paymentDetails as any).type);
      }
    }
  };

  const selectEWalletType = (type: string) => {
    setEWalletType(type);
    if (profilePaymentMethods && availableWallets.length > 0) {
      const wallet = availableWallets.find(w => w.type === type);
      if (wallet) {
        setEWalletDetails({ walletId: wallet.address, type });
        setSelectedWallet(wallet);
      }
    } else {
      setEWalletDetails(p => ({ ...p, type }));
    }
  };

  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBankDetails(p => ({ ...p, [e.target.name]: e.target.value }));
  };
  const handleEWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEWalletDetails(p => ({ ...p, [e.target.name]: e.target.value, type: eWalletType }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) < 1) return void toast.error("Minimum withdrawal is $1");
    const acc = accounts.find(a => a._id === selectedAccount);
    if (!acc) return void toast.error("Select an account");
    if (Number(amount) > acc.balance) return void toast.error("Amount exceeds available balance");
    // Open OTP verification before submitting
    setOtpOpen(true);
    setOtpSent(false);
    setOtpValue('');
    setOtpKey('');
    sendWithdrawalOTP();
  };

  const sendWithdrawalOTP = async () => {
    try {
      setOtpLoading(true);
      const token = getToken();
      const response = await axios.post(`${API_BASE_URL}/api/otp/withdrawal/send`,
        { amount, accountId: selectedAccount, paymentMethod: method === 'ewallet' ? eWalletType : method },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setOtpKey(response.data.otpKey);
        setOtpSent(true);
        toast.success('OTP sent to your registered email');
        setOtpResendCooldown(60);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
          setOtpResendCooldown(prev => { if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; } return prev - 1; });
        }, 1000);
      }
    } catch {
      toast.error('Failed to send OTP. Please try again.');
      setOtpOpen(false);
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyWithdrawalOTP = async () => {
    if (otpValue.length !== 6) return void toast.error('Enter a valid 6-digit OTP');
    try {
      setOtpLoading(true);
      const token = getToken();
      const verifyRes = await axios.post(`${API_BASE_URL}/api/otp/withdrawal/verify`,
        { otpKey, otp: otpValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (verifyRes.data.success) {
        toast.success('OTP verified! Processing withdrawal...');
        setOtpOpen(false);
        await submitWithdrawal();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const submitWithdrawal = async () => {
    setIsSubmitting(true);
    try {
      const acc = accounts.find(a => a._id === selectedAccount);
      if (!acc) return;
      await axios.post(`${API_BASE_URL}/api/withdrawals`, {
        accountId: selectedAccount,
        accountNumber: acc.mt5Account,
        accountType: acc.accountType,
        amount,
        paymentMethod: method === "ewallet" ? eWalletType : method,
        bankDetails: method === "bank" ? bankDetails : undefined,
        eWalletDetails: method === "ewallet" ? eWalletDetails : undefined
      }, authHeaders());
      const res = await axios.get(`${API_BASE_URL}/api/withdrawals/user`, authHeaders());
      setWithdrawalHistory(res.data.data);
      setAmount(""); setMethod(""); setEWalletType(""); setHasOpenTrades(false); setStep(0);
      toast.success("Withdrawal request submitted successfully!");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to submit withdrawal request";
      toast.error(msg);
      if (err.response?.data?.hasOpenTrades) setHasOpenTrades(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  const sortedAccounts = [...accounts].sort((a, b) => b.balance - a.balance);
  const fmtCurrency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Withdraw Funds</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Request a withdrawal from your trading account.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={['Select Account', 'Choose Method', 'Method Details', 'Confirm']} current={step} />

      {/* ── STEP 0: Select Account ────────────────────────────────────────── */}
      <StepWrapper stepNum={0} current={step} title="Select Account"
        summary={selectedAccountDetails
          ? `${selectedAccountDetails.mt5Account} — ${fmtCurrency(selectedAccountDetails.balance)} available`
          : undefined}>
        {isLoading.accounts ? (
          <div className="flex justify-center py-6"><Loader className="h-6 w-6 animate-spin" style={{ color: 'var(--theme-primary)' }} /></div>
        ) : (
          <div className="space-y-4">
            <Select value={selectedAccount} onValueChange={setSelectedAccount} disabled={accounts.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose trading account" />
              </SelectTrigger>
              <SelectContent>
                {sortedAccounts.map(a => (
                  <SelectItem key={a._id} value={a._id}>
                    {a.mt5Account} ({a.accountType}) — {fmtCurrency(a.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAccountDetails && (
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { label: 'Account ID', value: selectedAccountDetails.mt5Account },
                  { label: 'Account Type', value: selectedAccountDetails.accountType },
                  { label: 'Available Balance', value: fmtCurrency(selectedAccountDetails.balance) },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
                    <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--theme-text-disabled)' }}>{item.label}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--theme-text-primary)' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!selectedAccount}
              onClick={() => setStep(1)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 70%, #000))' }}>
              Continue with this account
            </motion.button>
          </div>
        )}
      </StepWrapper>

      {/* ── STEP 1: Choose Withdrawal Method ─────────────────────────────── */}
      <StepWrapper stepNum={1} current={step} title="Choose Withdrawal Method"
        summary={method ? (method === 'bank' ? 'Bank Transfer' : `E-Wallet${eWalletType ? ` (${eWalletType})` : ''}`) : undefined}>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { key: 'bank', label: 'Bank Transfer', desc: '1-3 business days processing', icon: Building2 },
              { key: 'ewallet', label: 'E-Wallet / Crypto', desc: 'Select wallet below', icon: Bitcoin },
            ].map(opt => (
              <motion.button
                key={opt.key}
                whileTap={{ scale: 0.97 }}
                onClick={() => selectPaymentMethod(opt.key)}
                className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                style={{
                  border: `1px solid ${method === opt.key ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                  background: method === opt.key ? 'color-mix(in srgb, var(--theme-primary) 8%, transparent)' : 'transparent'
                }}>
                <div className="rounded-xl p-3 flex-shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
                  <opt.icon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--theme-text-primary)' }}>{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{opt.desc}</p>
                </div>
                {method === opt.key && <CheckCircle2 className="w-5 h-5 ml-auto text-green-500 flex-shrink-0" />}
              </motion.button>
            ))}
          </div>

          {/* E-Wallet type selector */}
          <AnimatePresence>
            {method === 'ewallet' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--theme-text-muted)' }}>Select Wallet Type</p>
                <div className="grid grid-cols-3 gap-2">
                  {profilePaymentMethods && availableWallets.length > 0
                    ? availableWallets.map((w: any) => (
                      <button key={w.type} onClick={() => selectEWalletType(w.type)}
                        className="py-2 px-3 rounded-xl text-xs font-medium transition-all"
                        style={{
                          border: `1px solid ${eWalletType === w.type ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                          background: eWalletType === w.type ? 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' : 'transparent',
                          color: 'var(--theme-text-primary)'
                        }}>
                        {w.name}
                      </button>
                    ))
                    : ['Bitcoin', 'Ethereum', 'USDT'].map(wallet => (
                      <button key={wallet} onClick={() => selectEWalletType(wallet.toLowerCase())}
                        className="py-2 px-3 rounded-xl text-xs font-medium transition-all"
                        style={{
                          border: `1px solid ${eWalletType === wallet.toLowerCase() ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                          background: eWalletType === wallet.toLowerCase() ? 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' : 'transparent',
                          color: 'var(--theme-text-primary)'
                        }}>
                        {wallet}
                      </button>
                    ))
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={!method || (method === 'ewallet' && !eWalletType)}
            onClick={() => setStep(2)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 70%, #000))' }}>
            Continue with {method === 'bank' ? 'Bank Transfer' : method === 'ewallet' ? 'E-Wallet' : 'selected method'}
          </motion.button>
        </div>
      </StepWrapper>

      {/* ── STEP 2: Method Details ────────────────────────────────────────── */}
      <StepWrapper stepNum={2} current={step} title="Enter Payment Details"
        summary={method === 'bank' ? `Bank: ${bankDetails.bankName || 'Not set'}` : `Wallet: ${eWalletType}`}>
        <div className="space-y-4">
          {method === 'bank' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <FormInput label="Bank Name" name="bankName" value={bankDetails.bankName}
                onChange={handleBankChange} placeholder="e.g. HDFC Bank"
                readOnly={!!profilePaymentMethods} required />
              <FormInput label="Account Holder Name" name="accountHolderName" value={bankDetails.accountHolderName}
                onChange={handleBankChange} placeholder="Full name"
                readOnly={!!profilePaymentMethods} required />
              <FormInput label="Account Number" name="accountNumber" value={bankDetails.accountNumber}
                onChange={handleBankChange} placeholder="Account number"
                readOnly={!!profilePaymentMethods} required />
              <FormInput label="IFSC / SWIFT Code" name="ifscCode" value={bankDetails.ifscCode}
                onChange={handleBankChange} placeholder="e.g. HDFC0001234"
                readOnly={!!profilePaymentMethods} required />
            </div>
          )}

          {method === 'ewallet' && (
            <div className="space-y-3">
              <div className="rounded-xl p-3 flex items-center gap-3"
                style={{ background: 'color-mix(in srgb, var(--theme-primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-primary) 25%, transparent)' }}>
                <Bitcoin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>
                  {eWalletType ? eWalletType.toUpperCase() : 'No type selected'}
                </p>
              </div>
              <FormInput
                label={profilePaymentMethods && selectedWallet ? `${selectedWallet.name} Address` : 'Wallet Address / ID'}
                name="walletId" value={eWalletDetails.walletId}
                onChange={handleEWalletChange}
                placeholder={profilePaymentMethods && selectedWallet ? selectedWallet.address : 'Enter wallet address'}
                readOnly={!!(profilePaymentMethods && selectedWallet)} required />
              {profilePaymentMethods && selectedWallet && selectedWallet.address && (
                <button
                  onClick={() => { navigator.clipboard.writeText(selectedWallet.address); toast.success('Address copied!'); }}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ background: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)', color: 'var(--theme-primary)' }}>
                  <Copy className="w-3 h-3" />Copy address
                </button>
              )}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (method === 'bank' && (!bankDetails.bankName || !bankDetails.accountHolderName || !bankDetails.accountNumber || !bankDetails.ifscCode)) {
                return void toast.error("Fill all bank details");
              }
              if (method === 'ewallet' && !eWalletDetails.walletId) {
                return void toast.error("Enter wallet ID");
              }
              setStep(3);
            }}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 70%, #000))' }}>
            Confirm Details — Continue
          </motion.button>
        </div>
      </StepWrapper>

      {/* ── STEP 3: Amount & Confirm ──────────────────────────────────────── */}
      <StepWrapper stepNum={3} current={step} title="Enter Amount & Confirm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summary of previous steps */}
          <div className="grid sm:grid-cols-2 gap-3">
            {selectedAccountDetails && (
              <div className="rounded-xl p-3"
                style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
                <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--theme-text-disabled)' }}>From Account</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{selectedAccountDetails.mt5Account}</p>
                <p className="text-xs" style={{ color: '#10b981' }}>Available: {fmtCurrency(selectedAccountDetails.balance)}</p>
              </div>
            )}
            <div className="rounded-xl p-3"
              style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
              <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--theme-text-disabled)' }}>Payment Method</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>
                {method === 'bank' ? `${bankDetails.bankName || 'Bank Transfer'}` : `${eWalletType || 'E-Wallet'}`}
              </p>
              {method === 'bank' && bankDetails.accountNumber && (
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  ****{String(bankDetails.accountNumber).slice(-4)}
                </p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
              Withdrawal Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold"
                style={{ color: 'var(--theme-text-muted)' }}>$</span>
              <input
                type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" required
                className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <p className="text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>Minimum: $1</p>
              {selectedAccountDetails && (
                <button type="button"
                  onClick={() => setAmount(String(selectedAccountDetails.balance))}
                  className="text-[10px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--theme-primary)' }}>
                  Use max: {fmtCurrency(selectedAccountDetails.balance)}
                </button>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 rounded-xl p-3"
            style={{
              background: hasOpenTrades ? '#ef444415' : '#f59e0b12',
              border: `1px solid ${hasOpenTrades ? '#ef444440' : '#f59e0b40'}`
            }}>
            <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${hasOpenTrades ? 'text-red-500' : 'text-amber-500'}`} />
            <p className={`text-xs ${hasOpenTrades ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {hasOpenTrades
                ? "You have open trades. Close all positions before withdrawing."
                : "Withdrawals are processed within 1-3 business days after verification."}
            </p>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--theme-primary)' }} />
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              All withdrawals are secured and reviewed by our compliance team before processing.
            </p>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={isSubmitting || !amount || Number(amount) < 1}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            {isSubmitting ? (
              <><Loader className="w-4 h-4 animate-spin" />Processing…</>
            ) : (
              <><KeyRound className="w-4 h-4" />Verify & Submit Withdrawal</>
            )}
          </motion.button>
        </form>
      </StepWrapper>

      {/* ── Account Balances ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Account Balances</h2>
        </div>
        <div className="p-4">
          {isLoading.accounts ? (
            <div className="flex justify-center py-4"><Loader className="h-5 w-5 animate-spin" style={{ color: 'var(--theme-primary)' }} /></div>
          ) : sortedAccounts.length === 0 ? (
            <p className="text-center py-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>No accounts found</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {sortedAccounts.map(acc => (
                <div key={acc._id} className="flex items-center justify-between rounded-xl p-3"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
                      <Wallet className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>{acc.mt5Account}</p>
                      <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{acc.accountType}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold" style={{ color: acc.balance > 0 ? '#10b981' : 'var(--theme-text-muted)' }}>
                    {fmtCurrency(acc.balance)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Withdrawals ───────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Recent Withdrawals</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading.withdrawals ? (
            <div className="flex justify-center py-8"><Loader className="h-6 w-6 animate-spin" style={{ color: 'var(--theme-primary)' }} /></div>
          ) : withdrawalHistory.length === 0 ? (
            <div className="py-10 text-center">
              <Wallet className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No withdrawal history</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                  {['Account', 'Method', 'Amount', 'Date', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawalHistory.map(w => (
                  <tr key={w._id} className="transition-colors hover:opacity-80"
                    style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--theme-text-primary)' }}>{w.accountNumber}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                      {w.paymentMethod === 'bank' ? 'Bank Transfer'
                        : w.paymentMethod === 'card' ? 'Credit Card'
                          : `E-Wallet (${w.paymentMethod})`}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-red-500">
                      -{fmtCurrency(w.amount)}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--theme-text-muted)' }}>{formatDate(w.createdAt)}</td>
                    <td className="px-5 py-3"><StatusBadge status={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* ── Withdrawal OTP Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {otpOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setOtpOpen(false); }}>
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                    <KeyRound className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold" style={{ color: 'var(--theme-text-primary)' }}>Verify Withdrawal</h3>
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>OTP verification required</p>
                  </div>
                </div>
                <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--theme-text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {!otpSent ? 'Sending OTP to your registered email…' : 'A 6-digit OTP has been sent to your email. Enter it below to confirm the withdrawal.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--theme-border)' }}>
                    <p className="text-xs font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Amount: </p>
                    <p className="text-sm font-bold text-red-500">${Number(amount).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              {/* OTP Input */}
              <div className="px-6 pb-4">
                {!otpSent && otpLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                ) : (
                  <>
                    <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--theme-text-muted)' }}>Enter 6-Digit OTP</label>
                    <input
                      type="text" inputMode="numeric" maxLength={6}
                      value={otpValue}
                      onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      className="w-full text-center tracking-[0.5em] text-2xl font-mono rounded-xl px-4 py-3 outline-none transition-all"
                      style={{
                        background: 'var(--theme-bg-main)', border: '2px solid',
                        borderColor: otpValue.length === 6 ? '#10b981' : 'var(--theme-border)',
                        color: 'var(--theme-text-primary)'
                      }}
                      autoFocus
                    />
                    <div className="flex justify-center mt-3">
                      {otpResendCooldown > 0 ? (
                        <p className="text-xs" style={{ color: 'var(--theme-text-disabled)' }}>Resend in {otpResendCooldown}s</p>
                      ) : (
                        <button type="button" onClick={() => { setOtpValue(''); sendWithdrawalOTP(); }}
                          disabled={otpLoading}
                          className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
                          style={{ color: 'var(--theme-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <RefreshCw className="w-3 h-3" />Resend OTP
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3">
                <button type="button" onClick={() => setOtpOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}>
                  Cancel
                </button>
                <motion.button
                  type="button" whileTap={{ scale: 0.97 }}
                  onClick={verifyWithdrawalOTP}
                  disabled={otpLoading || otpValue.length !== 6}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                  {otpLoading ? <><Loader className="w-4 h-4 animate-spin" />Verifying…</> : <><CheckCircle2 className="w-4 h-4" />Verify & Submit</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
