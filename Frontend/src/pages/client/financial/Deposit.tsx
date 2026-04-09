// Frontend/src/pages/client/financial/Deposit.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  DollarSign, Wallet, Upload, X, Loader, CheckCircle2,
  Building2, Bitcoin, CreditCard, Copy, ExternalLink,
  ChevronRight, AlertCircle, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface PaymentMethod {
  _id: string; type: string; active: boolean;
  bankName?: string; accountHolderName?: string; accountNumber?: string; ifsc_swift?: string;
  walletName?: string; walletAddress?: string; qrCode?: string; paymentLink?: string;
}
interface Account { _id: string; mt5Account: string; accountType: string; }
interface Deposit {
  _id: string; account?: Account; amount: number; status: string;
  paymentMethod?: PaymentMethod; paymentType?: string; createdAt: string;
}
interface PaymentMethods { [key: string]: PaymentMethod[]; }

// ─── Step Indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ steps, current }: { steps: string[]; current: number }) => (
  <div className="flex items-center w-full mb-6">
    {steps.map((label, i) => {
      const isDone = i < current;
      const isActive = i === current;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              isDone ? 'text-white' : isActive ? 'text-white' : 'text-gray-400'
            }`}
              style={{
                background: isDone ? '#10b981' : isActive ? 'var(--theme-primary)' : 'var(--theme-border)',
                boxShadow: isActive ? '0 0 0 4px color-mix(in srgb, var(--theme-primary) 20%, transparent)' : 'none'
              }}>
              {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] mt-1 font-medium whitespace-nowrap hidden sm:block ${
              isActive ? '' : isDone ? 'text-green-600' : ''
            }`}
              style={{ color: isActive ? 'var(--theme-primary)' : isDone ? '#10b981' : 'var(--theme-text-disabled)' }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 mx-2 rounded-full transition-all duration-500"
              style={{ background: i < current ? '#10b981' : 'var(--theme-border)' }} />
          )}
        </React.Fragment>
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
    <motion.div
      layout
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        border: `1px solid ${isActive ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
        backgroundColor: 'var(--theme-bg-card)',
        opacity: isLocked ? 0.5 : 1,
        boxShadow: isActive ? '0 0 0 2px color-mix(in srgb, var(--theme-primary) 15%, transparent)' : 'none'
      }}
    >
      {/* Step Header */}
      <div className="flex items-center gap-3 p-4" style={{
        borderBottom: isActive ? '1px solid var(--theme-border)' : 'none',
        background: isDone ? '#10b98108' : isActive ? 'color-mix(in srgb, var(--theme-primary) 5%, transparent)' : 'transparent'
      }}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}
          style={{
            background: isDone ? '#10b981' : isActive ? 'var(--theme-primary)' : 'var(--theme-border)',
            color: isDone || isActive ? 'white' : 'var(--theme-text-muted)'
          }}>
          {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{title}</p>
          {isDone && summary && (
            <p className="text-xs truncate" style={{ color: '#10b981' }}>{summary}</p>
          )}
          {isLocked && (
            <p className="text-xs" style={{ color: 'var(--theme-text-disabled)' }}>Complete previous step first</p>
          )}
        </div>
        {isDone && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
      </div>

      {/* Step Content */}
      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
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
      style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Deposit() {
  const [step, setStep] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({});
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [selectedMethodDetails, setSelectedMethodDetails] = useState<PaymentMethod | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState({ accounts: false, methods: false, deposits: false });

  const getToken = () => localStorage.getItem('clientToken');
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
    fetchAccounts();
    fetchPaymentMethods();
    fetchDeposits();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(p => ({ ...p, accounts: true }));
    try {
      const res = await axios.get(`${API_BASE_URL}/api/accounts`, authHeaders());
      const data = res.data.data || [];
      setAccounts(data);
      if (data.length > 0) setSelectedAccount(data[0]._id);
    } catch { toast.error("Failed to fetch accounts"); }
    finally { setIsLoading(p => ({ ...p, accounts: false })); }
  };

  const fetchPaymentMethods = async () => {
    setIsLoading(p => ({ ...p, methods: true }));
    try {
      const res = await axios.get(`${API_BASE_URL}/api/clientdeposits/payment-methods`, authHeaders());
      setPaymentMethods(res.data.data || {});
    } catch { toast.error("Failed to fetch payment methods"); }
    finally { setIsLoading(p => ({ ...p, methods: false })); }
  };

  const fetchDeposits = async () => {
    setIsLoading(p => ({ ...p, deposits: true }));
    try {
      const res = await axios.get(`${API_BASE_URL}/api/clientdeposits`, authHeaders());
      setDeposits(res.data.data || []);
    } catch { /* silent */ }
    finally { setIsLoading(p => ({ ...p, deposits: false })); }
  };

  const selectPaymentType = (type: string, key: string) => {
    setSelectedPaymentType(key);
    setSelectedMethod(null);
    setSelectedMethodDetails(null);
    setStep(1);
  };

  const selectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method._id);
    setSelectedMethodDetails(method);
    setStep(2);
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return void toast.error("Invalid file type. Use PDF, JPG or PNG.");
    }
    if (file.size > 5 * 1024 * 1024) return void toast.error("Max file size is 5MB.");
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else setProofPreview(null);
    setProofFile(file);
  };

  const removeProofFile = () => {
    setProofFile(null); setProofPreview(null);
    const el = document.getElementById('proof-file-input') as HTMLInputElement;
    if (el) el.value = '';
  };

  const resetForm = () => {
    setSelectedPaymentType(null); setSelectedMethod(null); setSelectedMethodDetails(null);
    setAmount(""); setTransactionId(""); setProofFile(null); setProofPreview(null); setStep(0);
    const el = document.getElementById('proof-file-input') as HTMLInputElement;
    if (el) el.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return void toast.error("Please select an account");
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return void toast.error("Enter a valid amount");
    if (!transactionId.trim()) return void toast.error("Enter a transaction ID");
    if (!proofFile) return void toast.error("Upload proof of payment");
    if (!selectedMethod || !selectedPaymentType) return void toast.error("Select a payment method");

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('accountId', selectedAccount);
      fd.append('amount', amount);
      fd.append('paymentMethodId', selectedMethod);
      fd.append('paymentType', selectedPaymentType);
      fd.append('proofOfPayment', proofFile);
      fd.append('transactionId', transactionId);
      await axios.post(`${API_BASE_URL}/api/clientdeposits`, fd, {
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Deposit request submitted successfully!");
      resetForm();
      fetchDeposits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit deposit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Payment type options derived from methods
  const paymentTypeOptions: { key: string; label: string; desc: string; icon: React.ElementType; methods: PaymentMethod[] }[] = [];
  if (paymentMethods['Bank Account']?.length > 0) {
    paymentTypeOptions.push({ key: 'Bank Account', label: 'Bank Transfer', desc: '1-3 business days', icon: Building2, methods: paymentMethods['Bank Account'] });
  }
  if (paymentMethods['Crypto Wallet']?.length > 0) {
    paymentTypeOptions.push({ key: 'Crypto Wallet', label: 'Crypto / E-Wallet', desc: 'Near-instant', icon: Bitcoin, methods: paymentMethods['Crypto Wallet'] });
  }
  Object.entries(paymentMethods)
    .filter(([k]) => k !== 'Bank Account' && k !== 'Crypto Wallet')
    .forEach(([k, methods]) => {
      if (methods?.length > 0)
        paymentTypeOptions.push({ key: k, label: k, desc: 'Select to deposit', icon: CreditCard, methods });
    });

  const activeMethods = selectedPaymentType ? (paymentMethods[selectedPaymentType] || []) : [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Deposit Funds</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Add funds to your trading account in a few simple steps.
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={['Choose Type', 'Select Method', 'Payment Info', 'Submit']} current={step} />

      {/* ── STEP 0: Choose Payment Type ─────────────────────────────────── */}
      <StepWrapper stepNum={0} current={step} title="Choose Payment Type"
        summary={selectedPaymentType ? `Selected: ${selectedPaymentType === 'Bank Account' ? 'Bank Transfer' : selectedPaymentType === 'Crypto Wallet' ? 'Crypto / E-Wallet' : selectedPaymentType}` : undefined}>
        {isLoading.methods ? (
          <div className="flex justify-center py-8"><Loader className="h-8 w-8 animate-spin" style={{ color: 'var(--theme-primary)' }} /></div>
        ) : paymentTypeOptions.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--theme-text-muted)' }}>
            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No payment methods configured.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {paymentTypeOptions.map(opt => (
              <motion.button
                key={opt.key}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectPaymentType(opt.label, opt.key)}
                className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                style={{
                  border: `1px solid ${selectedPaymentType === opt.key ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                  background: selectedPaymentType === opt.key ? 'color-mix(in srgb, var(--theme-primary) 8%, transparent)' : 'transparent'
                }}
              >
                <div className="rounded-xl p-3 flex-shrink-0"
                  style={{ background: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
                  <opt.icon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: 'var(--theme-text-primary)' }}>{opt.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{opt.desc}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--theme-text-disabled)' }}>
                    {opt.methods.length} method{opt.methods.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--theme-text-muted)' }} />
              </motion.button>
            ))}
          </div>
        )}
      </StepWrapper>

      {/* ── STEP 1: Select Specific Method ──────────────────────────────── */}
      <StepWrapper stepNum={1} current={step} title="Select Method"
        summary={selectedMethodDetails
          ? selectedMethodDetails.type === 'Bank Account'
            ? `${selectedMethodDetails.bankName} — ${selectedMethodDetails.accountHolderName}`
            : `${selectedMethodDetails.walletName}`
          : undefined}>
        <div className="space-y-2">
          {activeMethods.map(method => (
            <motion.button
              key={method._id}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectMethod(method)}
              className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
              style={{
                border: `1px solid ${selectedMethod === method._id ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                background: selectedMethod === method._id ? 'color-mix(in srgb, var(--theme-primary) 8%, transparent)' : 'transparent'
              }}
            >
              <div className="rounded-xl p-2.5 flex-shrink-0"
                style={{ background: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
                {method.type === 'Bank Account' ? (
                  <Building2 className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                ) : (
                  <Wallet className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                  {method.bankName || method.walletName || method.accountHolderName || method.type}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--theme-text-muted)' }}>
                  {method.accountNumber
                    ? `Acc: ****${String(method.accountNumber).slice(-4)}`
                    : method.walletAddress
                      ? `${String(method.walletAddress).slice(0, 12)}…`
                      : method.type}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: method.active ? '#10b98120' : '#ef444420',
                    color: method.active ? '#10b981' : '#ef4444'
                  }}>
                  {method.active ? 'Active' : 'Inactive'}
                </span>
                <ChevronRight className="w-4 h-4" style={{ color: 'var(--theme-text-muted)' }} />
              </div>
            </motion.button>
          ))}
        </div>
      </StepWrapper>

      {/* ── STEP 2: Payment Info ─────────────────────────────────────────── */}
      <StepWrapper stepNum={2} current={step} title="Payment Information"
        summary={selectedMethodDetails ? "Method details shown below" : undefined}>
        {selectedMethodDetails && (
          <div className="space-y-4">
            {/* Bank Account Details */}
            {selectedMethodDetails.type === 'Bank Account' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Bank Name', value: selectedMethodDetails.bankName },
                  { label: 'Account Holder', value: selectedMethodDetails.accountHolderName },
                  { label: 'Account Number', value: selectedMethodDetails.accountNumber },
                  { label: 'IFSC / SWIFT', value: selectedMethodDetails.ifsc_swift },
                ].map(item => item.value ? (
                  <div key={item.label} className="rounded-xl p-3" style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
                    <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--theme-text-disabled)' }}>{item.label}</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>{item.value}</p>
                  </div>
                ) : null)}
              </div>
            )}

            {/* Crypto Wallet Details */}
            {selectedMethodDetails.type === 'Crypto Wallet' && (
              <div className="space-y-3">
                <div className="rounded-xl p-4" style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
                  <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--theme-text-disabled)' }}>Wallet Name</p>
                  <p className="text-sm font-semibold mb-3" style={{ color: 'var(--theme-text-primary)' }}>{selectedMethodDetails.walletName}</p>
                  <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--theme-text-disabled)' }}>Wallet Address</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono flex-1 break-all" style={{ color: 'var(--theme-text-primary)' }}>
                      {selectedMethodDetails.walletAddress}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMethodDetails.walletAddress || '');
                        toast.success('Address copied!');
                      }}
                      className="flex-shrink-0 rounded-lg p-2 transition-colors hover:opacity-70"
                      style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
                      <Copy className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code */}
            {selectedMethodDetails.qrCode && (
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl"
                style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>Scan QR Code to Pay</p>
                <img
                  src={`${API_BASE_URL.replace('/api', '')}${selectedMethodDetails.qrCode}`}
                  alt="QR Code" crossOrigin="anonymous"
                  className="w-40 h-40 object-contain rounded-xl"
                  style={{ border: '1px solid var(--theme-border)' }}
                />
                <a href={`${API_BASE_URL.replace('/api', '')}${selectedMethodDetails.qrCode}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs"
                  style={{ color: 'var(--theme-primary)' }}>
                  <ExternalLink className="w-3.5 h-3.5" />View full image
                </a>
              </div>
            )}

            {/* Confirm Info Read */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(3)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 70%, #000))' }}>
              I've noted the payment details — Continue
            </motion.button>
          </div>
        )}
      </StepWrapper>

      {/* ── STEP 3: Transaction Details ──────────────────────────────────── */}
      <StepWrapper stepNum={3} current={step} title="Transaction Details">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selected method summary */}
          {selectedMethodDetails && (
            <div className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: '#10b98110', border: '1px solid #10b98140' }}>
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                <span className="font-semibold" style={{ color: '#10b981' }}>
                  {selectedMethodDetails.bankName || selectedMethodDetails.walletName || selectedPaymentType}
                </span>
                {' '}selected for this deposit
              </div>
            </div>
          )}

          {/* Account Selection */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
              Deposit To Account
            </label>
            {isLoading.accounts ? (
              <div className="flex items-center gap-2 py-2">
                <Loader className="h-4 w-4 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <span className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading accounts…</span>
              </div>
            ) : (
              <Select value={selectedAccount} onValueChange={setSelectedAccount} disabled={accounts.length === 0}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.mt5Account} ({a.accountType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Amount (USD)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-bold"
                style={{ color: 'var(--theme-text-muted)' }}>$</span>
              <input
                type="number" placeholder="0.00" min="0" value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 transition-all"
                style={{
                  background: 'var(--theme-bg-main)',
                  border: '1px solid var(--theme-border)',
                  color: 'var(--theme-text-primary)',
                  '--tw-ring-color': 'var(--theme-primary)'
                } as any}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--theme-text-disabled)' }}>No minimum deposit required</p>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>Transaction ID / Reference</label>
            <input
              type="text" placeholder="Enter your transaction reference" value={transactionId}
              onChange={e => setTransactionId(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 transition-all"
              style={{
                background: 'var(--theme-bg-main)',
                border: '1px solid var(--theme-border)',
                color: 'var(--theme-text-primary)'
              }}
            />
          </div>

          {/* Proof Upload */}
          <div>
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--theme-text-primary)' }}>
              Proof of Payment
            </label>
            <div className="relative">
              {!proofFile ? (
                <label htmlFor="proof-file-input"
                  className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all duration-200 hover:opacity-80"
                  style={{ border: '2px dashed var(--theme-border)', background: 'var(--theme-bg-main)' }}>
                  <Upload className="w-8 h-8" style={{ color: 'var(--theme-text-muted)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>Click to upload proof</p>
                  <p className="text-xs" style={{ color: 'var(--theme-text-disabled)' }}>PDF, JPG, PNG — max 5MB</p>
                  <input id="proof-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleProofFileChange} />
                </label>
              ) : (
                <div className="rounded-xl p-4 flex items-center gap-4"
                  style={{ border: '1px solid #10b98140', background: '#10b98108' }}>
                  {proofPreview ? (
                    <img src={proofPreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ background: '#10b98120' }}>
                      <Upload className="w-6 h-6 text-green-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#10b981' }}>{proofFile.name}</p>
                    <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      {(proofFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button type="button" onClick={removeProofFile}
                    className="rounded-lg p-1.5 hover:opacity-70"
                    style={{ background: '#ef444420' }}>
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 rounded-xl p-3"
            style={{ background: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--theme-primary)' }} />
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              Your deposit will be reviewed and credited within 1-3 business hours after verification.
            </p>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={isSubmitting || !selectedAccount || !amount || !transactionId || !selectedMethod || !proofFile}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 60%, #000))' }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />Processing…
              </span>
            ) : 'Submit Deposit Request'}
          </motion.button>
        </form>
      </StepWrapper>

      {/* ── Recent Deposits ──────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Recent Deposits</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading.deposits ? (
            <div className="flex justify-center py-8">
              <Loader className="h-6 w-6 animate-spin" style={{ color: 'var(--theme-primary)' }} />
            </div>
          ) : deposits.length === 0 ? (
            <div className="py-10 text-center">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No deposits yet</p>
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
                {deposits.map(d => (
                  <tr key={d._id} className="transition-colors hover:opacity-80"
                    style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                      {d.account?.mt5Account || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                      {d.paymentMethod?.type || d.paymentType || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-green-600">
                      +${d.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                      {formatDate(d.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
