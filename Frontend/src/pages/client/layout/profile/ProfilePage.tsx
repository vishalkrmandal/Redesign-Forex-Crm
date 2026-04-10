// Frontend/src/pages/client/layout/profile/ProfilePage.tsx
import { useState, useEffect } from 'react';
import PersonalInfoForm from './PersonalInfoForm';
import AccountDetailsForm from './AccountDetailsForm';
import WalletDetailsForm from './WalletDetailsForm';
import axios from 'axios';
import { toast } from 'sonner';
import { User, CreditCard, Wallet, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TABS = [
  { key: 'personal', label: 'Personal Info',    icon: User,       color: '#6366f1' },
  { key: 'account',  label: 'Account Details',  icon: CreditCard, color: '#10b981' },
  { key: 'wallet',   label: 'Wallet Details',   icon: Wallet,     color: '#f59e0b' },
];

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstname: '', lastname: '', dateofbirth: '', phone: '', email: '',
      educationLevel: '', otherEducation: '', isEmployed: '',
      idDocument: undefined as string | undefined,
      address1Document: undefined as string | undefined,
      address2Document: undefined as string | undefined,
    },
    bankDetails: { bankName: '', accountHolderName: '', accountNumber: '', ifscSwiftCode: '' },
    walletDetails: { tetherWalletAddress: '', ethWalletAddress: '', accountNumber: '', trxWalletAddress: '' },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        if (!token) { toast.error('Please login to view your profile'); return; }
        const res = await axios.get(`${API_BASE_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) {
          const d = res.data.data;
          setProfileData({
            personalInfo: {
              ...d.personalInfo,
              educationLevel:  d.educationLevel  || '',
              otherEducation:  d.otherEducation  || '',
              isEmployed:      d.isEmployed ? 'yes' : 'no',
              idDocument:      d.idDocument       || undefined,
              address1Document: d.address1Document || undefined,
              address2Document: d.address2Document || undefined,
            },
            bankDetails:   d.bankDetails   || { bankName:'', accountHolderName:'', accountNumber:'', ifscSwiftCode:'' },
            walletDetails: d.walletDetails || { tetherWalletAddress:'', ethWalletAddress:'', accountNumber:'', trxWalletAddress:'' },
          });
        }
      } catch { toast.error('Failed to fetch profile data'); }
      finally { setLoading(false); }
    };
    fetchProfileData();
  }, []);

  const userStr = localStorage.getItem('clientUser');
  const user = userStr ? JSON.parse(userStr) : null;
  const initials = user ? `${user.firstname?.[0]||''}${user.lastname?.[0]||''}`.toUpperCase() : '?';

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>

      {/* ── Profile Hero ──────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
        border: '1px solid var(--theme-border)',
        display: 'flex', alignItems: 'center', gap: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(99,102,241,0.06)', pointerEvents:'none' }} />

        <div style={{
          width: 64, height: 64, borderRadius: 16, flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: 1,
          boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
        }}>
          {initials}
        </div>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0 }}>
              {user ? `${user.firstname} ${user.lastname}` : 'My Profile'}
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
              background: 'rgba(16,185,129,0.12)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.25)', textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              <Shield style={{ width: 9, height: 9, display: 'inline', marginRight: 3 }} />
              Verified
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: 0 }}>
            {user?.email || 'Manage your personal information and security settings'}
          </p>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 6, padding: 6, borderRadius: 12, marginBottom: 20,
        background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 700 : 500,
                background: active ? tab.color : 'transparent',
                color: active ? 'white' : 'var(--theme-text-muted)',
                transition: 'all 0.18s',
                boxShadow: active ? `0 2px 12px ${tab.color}40` : 'none',
              }}
            >
              <tab.icon style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 36, height: 36, border: '3px solid var(--theme-border)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--theme-text-muted)' }}>Loading profile…</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'personal' && (
              <PersonalInfoForm initialData={profileData.personalInfo} setProfileData={setProfileData} />
            )}
            {activeTab === 'account' && (
              <AccountDetailsForm initialData={profileData.bankDetails} setProfileData={setProfileData} />
            )}
            {activeTab === 'wallet' && (
              <WalletDetailsForm initialData={profileData.walletDetails} setProfileData={setProfileData} />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ProfilePage;
