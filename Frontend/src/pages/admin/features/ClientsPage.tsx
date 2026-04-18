// Frontend/src/pages/admin/features/ClientsPage.tsx
"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search, Filter, X, Eye, Lock, ChevronLeft, ChevronRight,
  Users, UserCheck, RefreshCw,
  CreditCard, LogIn, KeyRound,
} from "lucide-react"
import clientService from "./clientService"
import { toast } from "sonner"
import { impersonateClient } from "@/utils/impersonation"
import { motion, AnimatePresence } from "framer-motion"
import { createPortal } from "react-dom"

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

interface Client {
  id: string; name: string; email: string; firstname: string; lastname: string
  avatar?: string; accountNumber: string; status: string; isEmailVerified: boolean
  kycVerified: boolean; kycStatus: "unverified" | "verified" | "rejected"; kycRejectReason?: string
  country: { name: string; state: string }; ibPartner: string; phone: string
  dateofbirth: string; educationLevel: string; otherEducation: string
  idDocument: string; address1Document: string; address2Document: string
  bankDetails: { bankName: string; accountHolderName: string; accountNumber: string; ifscSwiftCode: string }
  walletDetails: { tetherWalletAddress: string; ethWalletAddress: string; accountNumber: string; trxWalletAddress: string }
}

interface Account {
  _id: string; mt5Account: string; name: string; accountType: string
  leverage: string; balance: number; equity: number; profit: number
}

// ─── Pill Badges ──────────────────────────────────────────────────────────────
const Pill = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color, whiteSpace: 'nowrap' }}>
    {label}
  </span>
)

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, children, maxWidth = 600 }: {
  open: boolean; onClose: () => void; children: React.ReactNode; maxWidth?: number
}) => {
  if (!open) return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }} transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{ width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto', background: 'var(--theme-bg-card)', borderRadius: 20, border: '1px solid var(--theme-border)', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const DRow = ({ label, value }: { label: string; value?: string | React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
    <span style={{ fontSize: 13, color: 'var(--theme-text-primary)', fontWeight: 500 }}>
      {value || <span style={{ color: 'var(--theme-text-disabled)' }}>—</span>}
    </span>
  </div>
)

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedKycStatus, setSelectedKycStatus] = useState<string | null>(null)
  const [selectedEmailStatus, setSelectedEmailStatus] = useState<string | null>(null)
  const [selectedIbPartner, setSelectedIbPartner] = useState<string | null>(null)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [clientDetailsDialogOpen, setClientDetailsDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accountsDialogOpen, setAccountsDialogOpen] = useState(false)
  const [clientAccounts, setClientAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [countries, setCountries] = useState<string[]>([])
  const [ibPartners, setIbPartners] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  const getFullDocumentUrl = (p: string) => {
    if (!p) return ''
    return `${API_BASE_URL}/${p.replace(/\\/g, '/')}`
  }

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await clientService.getAllClients()
      let clientsData: Client[] = []
      if (response.data && Array.isArray(response.data)) clientsData = response.data
      else if (Array.isArray(response)) clientsData = response
      else if (response.data?.clients && Array.isArray(response.data.clients)) clientsData = response.data.clients
      setClients(clientsData)
      setCountries([...new Set(clientsData.map((c: Client) => c.country?.name).filter(Boolean))] as string[])
      setIbPartners([...new Set(clientsData.map((c: Client) => c.ibPartner).filter(Boolean))] as string[])
    } catch {
      toast.error("Failed to fetch clients. Please try again.")
      setClients([]); setCountries([]); setIbPartners([])
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonateClient = async (client: Client) => {
    try {
      toast.loading("Preparing client access...")
      const response = await clientService.impersonateClient(client.id)
      if (response.success) {
        toast.dismiss(); toast.success("Client access prepared successfully")
        impersonateClient(response.clientToken, response.user)
      } else {
        toast.dismiss(); toast.error("Failed to access client account")
      }
    } catch {
      toast.dismiss(); toast.error("Failed to access client account. Please try again.")
    }
  }

  const handlePasswordDialog = async (client: Client) => {
    setSelectedClient(client)
    try {
      const response = await clientService.getClientPassword(client.id)
      setPassword(response.password || "Not available")
    } catch (error: any) {
      setPassword(error?.response?.status === 404 ? "Password not found" : "Error fetching password")
    }
    setPasswordDialogOpen(true)
  }

  const handleUpdatePassword = async () => {
    if (!selectedClient) return
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return }
    try {
      await clientService.updateClientPassword(selectedClient.id, newPassword)
      toast.success("Password updated successfully.")
      setPasswordDialogOpen(false); setNewPassword(""); setConfirmPassword("")
    } catch { toast.error("Failed to update password. Please try again.") }
  }

  const handleViewDetails = async (client: Client) => {
    setSelectedClient(client)
    try {
      const response = await clientService.getClientDetails(client.id)
      setSelectedClient(response.data); setClientDetailsDialogOpen(true)
    } catch { toast.error("Failed to fetch client details. Please try again.") }
  }

  const handleSuspendClient = async (clientId: string) => {
    try {
      await clientService.suspendClient(clientId)
      toast.success("Client suspended successfully."); fetchClients()
    } catch { toast.error("Failed to suspend client. Please try again.") }
  }

  const handleActivateClient = async (clientId: string) => {
    try {
      await clientService.activateClient(clientId)
      toast.success("Client activated successfully."); fetchClients()
    } catch { toast.error("Failed to activate client. Please try again.") }
  }

  const handleUpdateClient = async () => {
    if (!selectedClient) return
    if (selectedClient.kycStatus === "rejected" && !selectedClient.kycRejectReason?.trim()) {
      toast.error("Rejection reason is required when KYC status is set to Rejected"); return
    }
    const clientData: any = {
      firstname: selectedClient.firstname, lastname: selectedClient.lastname,
      email: selectedClient.email, isEmailVerified: selectedClient.isEmailVerified,
      country: selectedClient.country, phone: selectedClient.phone,
      dateofbirth: selectedClient.dateofbirth, kycVerified: selectedClient.kycStatus === "verified",
      kycStatus: selectedClient.kycStatus, kycRejectReason: selectedClient.kycRejectReason,
      ibPartner: selectedClient.ibPartner, bankDetails: selectedClient.bankDetails,
      walletDetails: selectedClient.walletDetails,
    }
    if (selectedClient.educationLevel?.trim() && selectedClient.educationLevel !== 'not-specified') {
      clientData.educationLevel = selectedClient.educationLevel
      if (selectedClient.educationLevel === 'other' && selectedClient.otherEducation)
        clientData.otherEducation = selectedClient.otherEducation
    }
    try {
      await clientService.updateClient(selectedClient.id, clientData)
      toast.success("Client updated successfully."); fetchClients(); setClientDetailsDialogOpen(false)
    } catch { toast.error("Failed to update client. Please try again.") }
  }

  const handleOpenDocument = (documentUrl: string) => {
    if (!documentUrl) return
    const fullUrl = getFullDocumentUrl(documentUrl)
    const isPdf = documentUrl.toLowerCase().endsWith('.pdf')
    if (isPdf) { window.open(fullUrl, '_blank') }
    else { const w = window.open(""); if (w) w.document.write(`<img src="${fullUrl}" style="max-width:100%">`) }
  }

  const handleViewAccounts = async (client: Client) => {
    setSelectedClient(client); setLoadingAccounts(true); setAccountsDialogOpen(true)
    try {
      const response = await clientService.getUserAccounts(client.id)
      setClientAccounts(response.data)
      if (response.warning) toast.warning(response.warning)
    } catch {
      toast.error("Failed to fetch user accounts."); handleCloseAccountsDialog()
    } finally { setLoadingAccounts(false) }
  }

  const handleCloseAccountsDialog = () => {
    setAccountsDialogOpen(false); setLoadingAccounts(false)
    setClientAccounts([]); setSelectedClient(null)
    setTimeout(() => { document.body.style.overflow = 'unset'; document.body.style.paddingRight = '0px' }, 100)
  }

  const resetFilters = () => {
    setSearchTerm(""); setSelectedCountry(null); setSelectedKycStatus(null)
    setSelectedEmailStatus(null); setSelectedIbPartner(null)
  }

  useEffect(() => { setCurrentPage(1) }, [searchTerm, selectedCountry, selectedKycStatus, selectedEmailStatus, selectedIbPartner])

  const { paginatedClients, totalPages, totalItems, startItem, endItem } = useMemo(() => {
    const arr = clients || []
    const filtered = arr.filter(c => {
      if (searchTerm && !c.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !c.email?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !c.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (selectedCountry && selectedCountry !== 'all' && c.country?.name !== selectedCountry) return false
      if (selectedKycStatus && selectedKycStatus !== 'all') {
        if (selectedKycStatus === 'Verified' && c.kycStatus !== 'verified') return false
        if (selectedKycStatus === 'Unverified' && c.kycStatus !== 'unverified') return false
        if (selectedKycStatus === 'Rejected' && c.kycStatus !== 'rejected') return false
      }
      if (selectedEmailStatus && selectedEmailStatus !== 'all') {
        if (selectedEmailStatus === 'Verified' && !c.isEmailVerified) return false
        if (selectedEmailStatus === 'Unverified' && c.isEmailVerified) return false
      }
      if (selectedIbPartner && selectedIbPartner !== 'all' && c.ibPartner !== selectedIbPartner) return false
      return true
    }).reverse()
    const total = filtered.length
    const pages = Math.max(1, Math.ceil(total / itemsPerPage))
    const start = (currentPage - 1) * itemsPerPage
    return {
      paginatedClients: filtered.slice(start, start + itemsPerPage),
      totalPages: pages, totalItems: total,
      startItem: total === 0 ? 0 : start + 1,
      endItem: Math.min(start + itemsPerPage, total),
    }
  }, [clients, searchTerm, selectedCountry, selectedKycStatus, selectedEmailStatus, selectedIbPartner, currentPage, itemsPerPage])

  const activeFilters = [selectedCountry, selectedKycStatus, selectedEmailStatus, selectedIbPartner].filter(Boolean).length
  const kycVerified = clients.filter(c => c.kycStatus === 'verified').length
  const kycPending = clients.filter(c => c.kycStatus === 'unverified').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: 1400, margin: '0 auto' }}
    >

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0, marginBottom: 4 }}>Client Management</h1>
          <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: 0 }}>View and manage all registered client accounts</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={fetchClients}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-card)', color: 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCw style={{ width: 13, height: 13 }} />Refresh
        </motion.button>
      </motion.div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Clients', value: clients.length, color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
          { label: 'KYC Verified', value: kycVerified, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'KYC Pending', value: kycPending, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Active', value: clients.filter(c => c.status === 'activated').length, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          { label: 'Suspended', value: clients.filter(c => c.status !== 'activated').length, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            whileHover={{ y: -3, scale: 1.02 }}
            style={{ borderRadius: 14, padding: '14px 16px', background: s.bg, border: `1px solid ${s.color}25`, cursor: 'default' }}
          >
            <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: 11, color: 'var(--theme-text-muted)', margin: 0 }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filter & Search ─────────────────────────────────────────────── */}
      <div style={{ background: 'var(--theme-bg-card)', borderRadius: 16, border: '1px solid var(--theme-border)', padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: 'var(--theme-text-disabled)' }} />
            <input type="text" placeholder="Search by name, email, account…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: 40, paddingLeft: 38, paddingRight: 14, borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', outline: 'none', fontSize: 13, color: 'var(--theme-text-primary)', boxSizing: 'border-box' }} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            style={{ height: 40, padding: '0 14px', borderRadius: 10, border: `1px solid ${showFilters ? '#6366f1' : 'var(--theme-border)'}`, background: showFilters ? 'rgba(99,102,241,0.1)' : 'var(--theme-bg-main)', color: showFilters ? '#6366f1' : 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter style={{ width: 13, height: 13 }} />Filters
            {activeFilters > 0 && <span style={{ background: '#6366f1', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilters}</span>}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ paddingTop: 16, marginTop: 14, borderTop: '1px solid var(--theme-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Country', value: selectedCountry, options: countries, onChange: setSelectedCountry },
                    { label: 'KYC Status', value: selectedKycStatus, options: ['Verified', 'Unverified', 'Rejected'], onChange: setSelectedKycStatus },
                    { label: 'Email Status', value: selectedEmailStatus, options: ['Verified', 'Unverified'], onChange: setSelectedEmailStatus },
                    { label: 'IB Partner', value: selectedIbPartner, options: ibPartners, onChange: setSelectedIbPartner },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>{f.label}</label>
                      <select value={f.value || 'all'} onChange={e => f.onChange(e.target.value === 'all' ? null : e.target.value)}
                        style={{ width: '100%', height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 12, outline: 'none' }}>
                        <option value="all">All {f.label}s</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={resetFilters}
                    style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <X style={{ width: 12, height: 12 }} />Reset All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeFilters > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>Active:</span>
            {[
              { v: selectedCountry, label: `Country: ${selectedCountry}`, clear: () => setSelectedCountry(null) },
              { v: selectedKycStatus, label: `KYC: ${selectedKycStatus}`, clear: () => setSelectedKycStatus(null) },
              { v: selectedEmailStatus, label: `Email: ${selectedEmailStatus}`, clear: () => setSelectedEmailStatus(null) },
              { v: selectedIbPartner, label: `IB: ${selectedIbPartner}`, clear: () => setSelectedIbPartner(null) },
            ].filter(c => c.v).map(c => (
              <span key={c.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: 11, fontWeight: 600 }}>
                {c.label}<X style={{ width: 10, height: 10, cursor: 'pointer' }} onClick={c.clear} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--theme-bg-card)', borderRadius: 16, border: '1px solid var(--theme-border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--theme-bg-main)' }}>
                {['Client', 'Account', 'Email Verified', 'KYC', 'Country', 'IB Partner', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--theme-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[120, 80, 70, 70, 80, 90, 60, 80].map((w, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: 12, borderRadius: 6, background: 'var(--theme-border)', width: w, animation: 'pulse 1.5s ease-in-out infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedClients.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <Users style={{ width: 40, height: 40, color: 'var(--theme-border)', margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 14, color: 'var(--theme-text-muted)', margin: 0 }}>No clients found</p>
                  {(searchTerm || activeFilters > 0) && <button onClick={resetFilters} style={{ marginTop: 8, fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filters</button>}
                </td></tr>
              ) : paginatedClients.map((client, idx) => (
                <motion.tr key={client.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}
                  style={{ borderBottom: '1px solid var(--theme-border)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--theme-bg-main)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {/* Client */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                        {client.firstname?.[0]?.toUpperCase()}{client.lastname?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)' }}>{client.name || `${client.firstname} ${client.lastname}`}</div>
                        <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{client.email}</div>
                      </div>
                    </div>
                  </td>
                  {/* Account */}
                  <td style={{ padding: '12px 16px', fontSize: 11, color: 'var(--theme-text-muted)', fontFamily: 'monospace' }}>{client.accountNumber || '—'}</td>
                  {/* Email Verified */}
                  <td style={{ padding: '12px 16px' }}>
                    {client.isEmailVerified
                      ? <Pill label="Verified" color="#10b981" bg="rgba(16,185,129,0.1)" />
                      : <Pill label="Unverified" color="#ef4444" bg="rgba(239,68,68,0.1)" />}
                  </td>
                  {/* KYC */}
                  <td style={{ padding: '12px 16px' }}>
                    {client.kycStatus === 'verified'
                      ? <Pill label="Verified" color="#10b981" bg="rgba(16,185,129,0.1)" />
                      : client.kycStatus === 'rejected'
                        ? <Pill label="Rejected" color="#ef4444" bg="rgba(239,68,68,0.1)" />
                        : <Pill label="Pending" color="#f59e0b" bg="rgba(245,158,11,0.1)" />}
                  </td>
                  {/* Country */}
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--theme-text-muted)' }}>{client.country?.name || '—'}</td>
                  {/* IB Partner */}
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--theme-text-muted)' }}>{client.ibPartner || '—'}</td>
                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    {client.status === 'activated'
                      ? <Pill label="Active" color="#10b981" bg="rgba(16,185,129,0.1)" />
                      : <Pill label="Suspended" color="#ef4444" bg="rgba(239,68,68,0.1)" />}
                  </td>
                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
                      <button title="View Details" onClick={() => handleViewDetails(client)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--theme-border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-muted)' }}>
                        <Eye style={{ width: 12, height: 12 }} />
                      </button>
                      <button title="View Accounts" onClick={() => handleViewAccounts(client)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <CreditCard style={{ width: 12, height: 12 }} />
                      </button>
                      <button title="Login as Client" onClick={() => handleImpersonateClient(client)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                        <LogIn style={{ width: 12, height: 12 }} />
                      </button>
                      <button title="Manage Password" onClick={() => handlePasswordDialog(client)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                        <KeyRound style={{ width: 12, height: 12 }} />
                      </button>
                      {client.status === 'activated'
                        ? <button title="Suspend Client" onClick={() => handleSuspendClient(client.id)}
                          style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                          <Lock style={{ width: 12, height: 12 }} />
                        </button>
                        : <button title="Activate Client" onClick={() => handleActivateClient(client.id)}
                          style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                          <UserCheck style={{ width: 12, height: 12 }} />
                        </button>
                      }
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalItems > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--theme-border)', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>{startItem}–{endItem} of {totalItems}</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                style={{ height: 30, padding: '0 8px', borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-muted)', fontSize: 11, outline: 'none' }}>
                {[10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft style={{ width: 14, height: 14, color: 'var(--theme-text-muted)' }} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i
                if (page < 1 || page > totalPages) return null
                return (
                  <button key={page} onClick={() => setCurrentPage(page)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${page === currentPage ? '#6366f1' : 'var(--theme-border)'}`, background: page === currentPage ? '#6366f1' : 'var(--theme-bg-main)', color: page === currentPage ? 'white' : 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {page}
                  </button>
                )
              })}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight style={{ width: 14, height: 14, color: 'var(--theme-text-muted)' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Client Details Modal ─────────────────────────────────────────── */}
      <Modal open={clientDetailsDialogOpen} onClose={() => setClientDetailsDialogOpen(false)} maxWidth={640}>
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)' }}>Client Details</h3>
            <button onClick={() => setClientDetailsDialogOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--theme-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 13, height: 13, color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
        </div>
        {selectedClient && (
          <div style={{ padding: 24 }}>
            {/* Personal */}
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Personal Information</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <DRow label="First Name" value={selectedClient.firstname} />
              <DRow label="Last Name" value={selectedClient.lastname} />
              <DRow label="Email" value={selectedClient.email} />
              <DRow label="Phone" value={selectedClient.phone} />
              <DRow label="Date of Birth" value={selectedClient.dateofbirth} />
              <DRow label="Country" value={selectedClient.country?.name} />
              <DRow label="IB Partner" value={selectedClient.ibPartner} />
              <DRow label="Account Number" value={selectedClient.accountNumber} />
            </div>

            {/* KYC Controls */}
            <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: 18, marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>KYC Status</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: selectedClient.kycStatus === 'rejected' ? 12 : 0 }}>
                {(['unverified', 'verified', 'rejected'] as const).map(s => (
                  <button key={s} onClick={() => setSelectedClient(prev => prev ? { ...prev, kycStatus: s } : prev)}
                    style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${selectedClient.kycStatus === s ? (s === 'verified' ? '#10b981' : s === 'rejected' ? '#ef4444' : '#f59e0b') : 'var(--theme-border)'}`, background: selectedClient.kycStatus === s ? (s === 'verified' ? 'rgba(16,185,129,0.1)' : s === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)') : 'var(--theme-bg-main)', color: selectedClient.kycStatus === s ? (s === 'verified' ? '#10b981' : s === 'rejected' ? '#ef4444' : '#f59e0b') : 'var(--theme-text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {s}
                  </button>
                ))}
              </div>
              {selectedClient.kycStatus === 'rejected' && (
                <input type="text" placeholder="Rejection reason (required)" value={selectedClient.kycRejectReason || ''}
                  onChange={e => setSelectedClient(prev => prev ? { ...prev, kycRejectReason: e.target.value } : prev)}
                  style={{ width: '100%', height: 36, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              )}
            </div>

            {/* Documents */}
            {(selectedClient.idDocument || selectedClient.address1Document || selectedClient.address2Document) && (
              <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: 18, marginBottom: 20 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Documents</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'ID Document', url: selectedClient.idDocument },
                    { label: 'Address 1', url: selectedClient.address1Document },
                    { label: 'Address 2', url: selectedClient.address2Document },
                  ].filter(d => d.url).map(doc => (
                    <button key={doc.label} onClick={() => handleOpenDocument(doc.url)}
                      style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#6366f1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      View {doc.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setClientDetailsDialogOpen(false)}
                style={{ height: 40, padding: '0 20px', borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleUpdateClient}
                style={{ height: 40, padding: '0 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Password Modal ───────────────────────────────────────────────── */}
      <Modal open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth={440}>
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg,rgba(245,158,11,0.08),transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <KeyRound style={{ width: 18, height: 18, color: '#f59e0b' }} />Password Manager
            </h3>
            <button onClick={() => setPasswordDialogOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--theme-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 13, height: 13, color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
          {selectedClient && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--theme-text-muted)' }}>{selectedClient.name || `${selectedClient.firstname} ${selectedClient.lastname}`}</p>}
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: 'var(--theme-text-muted)', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 700 }}>Current Password</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--theme-text-primary)', margin: 0, fontFamily: 'monospace' }}>{password || '—'}</p>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password"
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: '1px solid var(--theme-border)', background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)', marginBottom: 5, textTransform: 'uppercase' }}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password"
              style={{ width: '100%', height: 40, padding: '0 12px', borderRadius: 10, border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? 'rgba(239,68,68,0.5)' : 'var(--theme-border)'}`, background: 'var(--theme-bg-main)', color: 'var(--theme-text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            {confirmPassword && confirmPassword !== newPassword && <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>Passwords do not match</p>}
          </div>
          <button onClick={handleUpdatePassword} disabled={!newPassword || newPassword !== confirmPassword}
            style={{ width: '100%', height: 42, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: (!newPassword || newPassword !== confirmPassword) ? 0.6 : 1 }}>
            Update Password
          </button>
        </div>
      </Modal>

      {/* ── MT5 Accounts Modal ───────────────────────────────────────────── */}
      <Modal open={accountsDialogOpen} onClose={handleCloseAccountsDialog} maxWidth={640}>
        <div style={{ padding: '22px 24px 20px', borderBottom: '1px solid var(--theme-border)', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--theme-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard style={{ width: 18, height: 18, color: '#6366f1' }} />MT5 Accounts
            </h3>
            <button onClick={handleCloseAccountsDialog} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'var(--theme-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X style={{ width: 13, height: 13, color: 'var(--theme-text-muted)' }} />
            </button>
          </div>
          {selectedClient && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--theme-text-muted)' }}>{selectedClient.name || `${selectedClient.firstname} ${selectedClient.lastname}`}</p>}
        </div>
        <div style={{ padding: 24 }}>
          {loadingAccounts ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ width: 30, height: 30, border: '3px solid var(--theme-border)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, color: 'var(--theme-text-muted)', margin: 0 }}>Loading accounts…</p>
            </div>
          ) : clientAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <CreditCard style={{ width: 40, height: 40, color: 'var(--theme-border)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: 'var(--theme-text-muted)', margin: 0 }}>No trading accounts found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {clientAccounts.map(acc => (
                <div key={acc._id} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--theme-bg-main)', border: '1px solid var(--theme-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-primary)', fontFamily: 'monospace' }}>{acc.mt5Account}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 600 }}>{acc.accountType}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>1:{acc.leverage}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--theme-text-disabled)', margin: '0 0 2px', textTransform: 'uppercase' }}>Balance</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-primary)', margin: 0 }}>${(acc.balance || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--theme-text-disabled)', margin: '0 0 2px', textTransform: 'uppercase' }}>Equity</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--theme-text-primary)', margin: 0 }}>${(acc.equity || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--theme-text-disabled)', margin: '0 0 2px', textTransform: 'uppercase' }}>P&L</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: acc.profit >= 0 ? '#10b981' : '#ef4444', margin: 0 }}>{acc.profit >= 0 ? '+' : ''}${(acc.profit || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </motion.div>
  )
}

export default ClientsPage
