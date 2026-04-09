// Frontend/src/pages/client/financial/Transfer.tsx
import { useState, useEffect } from "react";
import { ArrowLeftRight, AlertCircle, Loader, Wallet, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Account {
  _id: string; mt5Account: string; accountType: string; balance: number;
}
interface Transfer {
  _id: string;
  fromAccount?: { mt5Account: string };
  toAccount?: { mt5Account: string };
  amount: number; status: string; createdAt: string;
}

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v);

const StatusBadge = ({ status }: { status: string }) => {
  const cfg: Record<string, { bg: string; text: string }> = {
    completed: { bg: '#10b98120', text: '#10b981' },
    failed: { bg: '#ef444420', text: '#ef4444' },
    pending: { bg: '#f59e0b20', text: '#f59e0b' },
  };
  const c = cfg[status.toLowerCase()] || cfg.pending;
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ background: c.bg, color: c.text }}>{status}</span>
  );
};

export default function Transfer() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [formData, setFormData] = useState({ fromAccountId: "", toAccountId: "", amount: "" });
  const [swapping, setSwapping] = useState(false);

  const triggerBalanceUpdate = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const userData = JSON.parse(localStorage.getItem('clientUser') || '{}');
      if (!token || !userData.id) return;
      await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/users/${userData.id}/accounts`,
        { headers: { Authorization: `Bearer ${token}` } });
    } catch { /* silent */ }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      triggerBalanceUpdate();
      const token = localStorage.getItem("clientToken");
      const [accountsRes, transfersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/transfers/accounts`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/transfers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const accs = accountsRes.data?.data || [];
      setAccounts(accs);
      setTransfers(transfersRes.data?.data || []);
      if (accs.length >= 2) {
        setFormData({ fromAccountId: accs[0]._id, toAccountId: accs[1]._id, amount: "" });
      }
    } catch {
      toast.error("Failed to fetch account data");
      setAccounts([]); setTransfers([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUserData(); }, []);

  const fromAccount = accounts.find(a => a._id === formData.fromAccountId);
  const toAccount = accounts.find(a => a._id === formData.toAccountId);

  const handleSwap = async () => {
    setSwapping(true);
    await new Promise(r => setTimeout(r, 300));
    setFormData(p => ({ ...p, fromAccountId: p.toAccountId, toAccountId: p.fromAccountId }));
    setSwapping(false);
    toast.info("Accounts swapped");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.fromAccountId === formData.toAccountId) return void toast.error("Cannot transfer to the same account");
    if (parseFloat(formData.amount) < 10) return void toast.error("Minimum transfer amount is $10");
    if (fromAccount && parseFloat(formData.amount) > fromAccount.balance) return void toast.error("Insufficient balance");
    try {
      setTransferring(true);
      await axios.post(`${API_BASE_URL}/api/transfers`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("clientToken")}` }
      });
      toast.success("Transfer completed successfully!");
      fetchUserData();
      setFormData(p => ({ ...p, amount: "" }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transfer failed");
    } finally { setTransferring(false); }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: 'var(--theme-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading accounts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text-primary)' }}>Transfer Funds</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
          Move funds between your trading accounts instantly.
        </p>
      </div>

      {/* Transfer Form Card */}
      <div className="rounded-2xl p-6"
        style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-xl p-2.5" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
            <ArrowLeftRight className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Internal Transfer</h2>
            <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Instant, no fees</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Account */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--theme-text-muted)' }}>FROM ACCOUNT</label>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
              <select
                value={formData.fromAccountId}
                onChange={e => setFormData(p => ({ ...p, fromAccountId: e.target.value }))}
                className="w-full px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', border: 'none' }}
                required
              >
                <option value="">Select source account</option>
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.mt5Account} ({a.accountType}) — {fmtCurrency(a.balance)}
                  </option>
                ))}
              </select>
            </div>
            {fromAccount && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="mt-2 rounded-xl p-3 flex items-center justify-between"
                style={{ background: 'color-mix(in srgb, var(--theme-primary) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--theme-text-primary)' }}>{fromAccount.accountType}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Available</p>
                  <p className="text-sm font-bold" style={{ color: '#10b981' }}>{fmtCurrency(fromAccount.balance)}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex items-center justify-center">
            <motion.button
              type="button"
              onClick={handleSwap}
              whileTap={{ scale: 0.9 }}
              animate={{ rotate: swapping ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-80"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 60%, #000))',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--theme-primary) 30%, transparent)'
              }}>
              <ArrowLeftRight className="w-4 h-4 text-white" />
            </motion.button>
          </div>

          {/* To Account */}
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--theme-text-muted)' }}>TO ACCOUNT</label>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-border)' }}>
              <select
                value={formData.toAccountId}
                onChange={e => setFormData(p => ({ ...p, toAccountId: e.target.value }))}
                className="w-full px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', border: 'none' }}
                required
              >
                <option value="">Select destination account</option>
                {accounts.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.mt5Account} ({a.accountType}) — {fmtCurrency(a.balance)}
                  </option>
                ))}
              </select>
            </div>
            {toAccount && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="mt-2 rounded-xl p-3 flex items-center justify-between"
                style={{ background: '#10b98108', border: '1px solid #10b98130' }}>
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium" style={{ color: 'var(--theme-text-primary)' }}>{toAccount.accountType}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Current balance</p>
                  <p className="text-sm font-bold text-green-600">{fmtCurrency(toAccount.balance)}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>AMOUNT</label>
              {fromAccount && (
                <button type="button"
                  onClick={() => setFormData(p => ({ ...p, amount: String(fromAccount.balance) }))}
                  className="text-[10px] font-medium transition-opacity hover:opacity-70"
                  style={{ color: 'var(--theme-primary)' }}>
                  Transfer max
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm font-bold"
                style={{ color: 'var(--theme-text-muted)' }}>$</span>
              <input
                type="number" min="10" step="0.01" value={formData.amount}
                onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))}
                placeholder="0.00" required
                className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-primary)' }}
              />
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--theme-text-disabled)' }}>Minimum transfer: $10</p>
          </div>

          {/* Transfer Preview */}
          <AnimatePresence>
            {fromAccount && toAccount && formData.amount && parseFloat(formData.amount) >= 10 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="rounded-xl p-4"
                style={{ background: 'color-mix(in srgb, var(--theme-primary) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--theme-text-primary)' }}>Transfer Preview</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-center rounded-lg p-2" style={{ background: 'var(--theme-bg-card)' }}>
                    <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{fromAccount.mt5Account}</p>
                    <p className="text-sm font-bold text-red-500">-{fmtCurrency(parseFloat(formData.amount))}</p>
                    <p className="text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>
                      After: {fmtCurrency(fromAccount.balance - parseFloat(formData.amount))}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--theme-primary)' }} />
                  <div className="flex-1 text-center rounded-lg p-2" style={{ background: 'var(--theme-bg-card)' }}>
                    <p className="text-[10px]" style={{ color: 'var(--theme-text-muted)' }}>{toAccount.mt5Account}</p>
                    <p className="text-sm font-bold text-green-500">+{fmtCurrency(parseFloat(formData.amount))}</p>
                    <p className="text-[10px]" style={{ color: 'var(--theme-text-disabled)' }}>
                      After: {fmtCurrency(toAccount.balance + parseFloat(formData.amount))}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info */}
          <div className="flex items-center gap-3 rounded-xl p-3"
            style={{ background: '#3b82f612', border: '1px solid #3b82f640' }}>
            <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Transfers are processed instantly between your accounts. No fees apply.
            </p>
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={transferring || !formData.fromAccountId || !formData.toAccountId || !formData.amount}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 60%, #000))' }}>
            {transferring ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />Transferring…
              </span>
            ) : 'Transfer Funds'}
          </motion.button>
        </form>
      </div>

      {/* Account Balances */}
      <div className="rounded-2xl p-5"
        style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl p-2" style={{ background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
          </div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Account Balances</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {accounts.length === 0 ? (
            <p className="col-span-2 text-center py-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>No accounts found</p>
          ) : accounts.map(acc => (
            <div key={acc._id} className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2" style={{ background: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)' }}>
                  <Wallet className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--theme-text-primary)' }}>{acc.mt5Account}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'color-mix(in srgb, var(--theme-primary) 12%, transparent)', color: 'var(--theme-primary)' }}>
                    {acc.accountType}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Balance</p>
                <p className="text-base font-bold" style={{ color: acc.balance > 0 ? '#10b981' : 'var(--theme-text-muted)' }}>
                  {fmtCurrency(acc.balance)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transfers */}
      <div className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--theme-text-primary)' }}>Recent Transfers</h2>
        </div>
        <div className="overflow-x-auto">
          {transfers.length === 0 ? (
            <div className="py-10 text-center">
              <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-20" style={{ color: 'var(--theme-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>No transfers yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                  {['From', 'To', 'Amount', 'Date', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: 'var(--theme-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t._id} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                      {t.fromAccount?.mt5Account || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--theme-text-primary)' }}>
                      {t.toAccount?.mt5Account || '—'}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold" style={{ color: 'var(--theme-primary)' }}>
                      {fmtCurrency(t.amount)}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={t.status} />
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
