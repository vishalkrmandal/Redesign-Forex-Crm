import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PersonalInfoForm from './PersonalInfoForm';
import AccountDetailsForm from './AccountDetailsForm';
import WalletDetailsForm from './WalletDetailsForm';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ShieldCheck, ShieldAlert, ShieldX, User, Building2, Wallet,
  ChevronRight, AlertTriangle, CheckCircle2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type KycStatus = 'unverified' | 'verified' | 'rejected';
type TabKey = 'personal' | 'account' | 'wallet';

const TABS: { key: TabKey; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'personal', label: 'Personal Info', icon: User, desc: 'Identity & documents' },
  { key: 'account', label: 'Bank Details', icon: Building2, desc: 'Banking information' },
  { key: 'wallet', label: 'Wallet Details', icon: Wallet, desc: 'Crypto addresses' },
];

const KYC_CONFIG: Record<KycStatus, { icon: React.ElementType; label: string; color: string; bg: string; border: string; desc: string }> = {
  verified: {
    icon: ShieldCheck, label: 'KYC Verified', color: '#10b981',
    bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)',
    desc: 'Your identity has been verified successfully.'
  },
  rejected: {
    icon: ShieldX, label: 'KYC Rejected', color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)',
    desc: 'Your verification was rejected. Please update and resubmit.'
  },
  unverified: {
    icon: ShieldAlert, label: 'Pending Verification', color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
    desc: 'Complete your profile to submit for KYC verification.'
  },
};

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstname: '', lastname: '', dateofbirth: '', phone: '', email: '',
      educationLevel: '', otherEducation: '', isEmployed: '',
      idDocument: undefined as string | undefined,
      address1Document: undefined as string | undefined,
      address2Document: undefined as string | undefined
    },
    bankDetails: { bankName: '', accountHolderName: '', accountNumber: '', ifscSwiftCode: '' },
    walletDetails: { tetherWalletAddress: '', ethWalletAddress: '', accountNumber: '', trxWalletAddress: '' }
  });
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<KycStatus>('unverified');
  const [kycRejectReason, setKycRejectReason] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('personal');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        const sessionId = sessionStorage.getItem('sessionId');
        const sessionToken = sessionStorage.getItem('sessionToken');
        if (!token) { toast.error("Please login to view your profile"); return; }
        const response = await axios.get(`${API_BASE_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}`, 'x-session-id': sessionId || '', 'x-session-token': sessionToken || '' }
        });
        if (response.data.success) {
          const data = response.data.data;
          setKycStatus(data.kycStatus || 'unverified');
          setKycRejectReason(data.kycRejectReason || null);
          setProfileData({
            personalInfo: {
              ...data.personalInfo,
              educationLevel: data.educationLevel || '',
              otherEducation: data.otherEducation || '',
              isEmployed: data.isEmployed ? 'yes' : 'no',
              idDocument: data.idDocument || undefined,
              address1Document: data.address1Document || undefined,
              address2Document: data.address2Document || undefined
            },
            bankDetails: data.bankDetails || { bankName: '', accountHolderName: '', accountNumber: '', ifscSwiftCode: '' },
            walletDetails: data.walletDetails || { tetherWalletAddress: '', ethWalletAddress: '', accountNumber: '', trxWalletAddress: '' }
          });
        }
      } catch {
        toast.error("Failed to fetch profile data");
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const kyc = KYC_CONFIG[kycStatus];
  const KycIcon = kyc.icon;
  const fullName = `${profileData.personalInfo.firstname} ${profileData.personalInfo.lastname}`.trim() || 'User';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="min-h-screen" style={{ background: 'var(--theme-bg-main)' }}>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Hero Card ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl"
          style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)' }} />
          <div className="relative p-6 flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {initials}
              </div>
              {kycStatus === 'verified' && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center bg-green-500 border-2"
                  style={{ borderColor: 'var(--theme-bg-card)' }}>
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-6 w-40 rounded-lg animate-pulse" style={{ background: 'var(--theme-border)' }} />
                  <div className="h-4 w-56 rounded-lg animate-pulse" style={{ background: 'var(--theme-border)' }} />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold truncate" style={{ color: 'var(--theme-text-primary)' }}>{fullName}</h1>
                  <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--theme-text-muted)' }}>{profileData.personalInfo.email}</p>
                  {profileData.personalInfo.phone && (
                    <p className="text-xs mt-1" style={{ color: 'var(--theme-text-disabled)' }}>{profileData.personalInfo.phone}</p>
                  )}
                </>
              )}
            </div>

            {/* KYC Status */}
            <div className="flex-shrink-0 space-y-2">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: kyc.bg, border: `1px solid ${kyc.border}` }}>
                <KycIcon className="w-5 h-5 flex-shrink-0" style={{ color: kyc.color }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: kyc.color }}>{kyc.label}</p>
                  <p className="text-xs mt-0.5 max-w-[180px]" style={{ color: 'var(--theme-text-muted)' }}>{kyc.desc}</p>
                </div>
              </motion.div>
              {kycStatus === 'rejected' && kycRejectReason && (
                <div className="rounded-lg px-3 py-2 flex items-start gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-red-500" />
                  <p className="text-xs text-red-500">Reason: {kycRejectReason}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--theme-primary)', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Loading profile…</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Sidebar Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="lg:w-56 flex-shrink-0">
              <div className="rounded-2xl overflow-hidden sticky top-6"
                style={{ background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)' }}>
                <div className="px-4 pt-4 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--theme-text-disabled)' }}>
                    Profile Sections
                  </p>
                </div>
                <div className="p-2 space-y-1">
                  {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <motion.button
                        key={tab.key}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(tab.key)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200"
                        style={{
                          background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                          border: `1px solid ${isActive ? 'rgba(99,102,241,0.25)' : 'transparent'}`,
                        }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{ background: isActive ? 'rgba(99,102,241,0.2)' : 'var(--theme-bg-main)' }}>
                          <Icon className="w-4 h-4" style={{ color: isActive ? '#6366f1' : 'var(--theme-text-muted)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate"
                            style={{ color: isActive ? '#6366f1' : 'var(--theme-text-primary)' }}>{tab.label}</p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--theme-text-disabled)' }}>{tab.desc}</p>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#6366f1' }} />}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="p-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                  <div className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: kyc.bg }}>
                    <KycIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: kyc.color }} />
                    <p className="text-[11px] font-semibold" style={{ color: kyc.color }}>{kyc.label}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Animated Tab Content */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
