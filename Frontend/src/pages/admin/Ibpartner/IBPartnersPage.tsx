import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { PlusCircle, Pencil, ChevronDown, Check, Users, Award, Clock, TrendingUp, X } from "lucide-react"
import { toast } from "sonner"
import {
  Group, IBConfiguration, getGroups, getIBConfigurationsByGroup,
  createIBConfiguration, updateIBConfiguration, updateGroupDefaultTime
} from "@/pages/admin/Ibpartner/ibapi"

// ── Modal Shell ───────────────────────────────────────────────────────────────
function Modal({ open, onClose, children, width = 480 }: {
  open: boolean; onClose: () => void; children: React.ReactNode; width?: number
}) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, padding: 20
          }}
        >
          <motion.div
            initial={{ scale: 0.93, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--theme-bg-card)', borderRadius: 16,
              border: '1px solid var(--theme-border)', width: '100%', maxWidth: width,
              maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

// ── Group Selector Dropdown ───────────────────────────────────────────────────
function GroupSelect({ groups, value, onChange }: {
  groups: Group[]; value: string; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = groups.find(g => g._id === value)
  return (
    <div style={{ position: 'relative', minWidth: 220 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 10,
          border: `1px solid ${open ? '#6366f1' : 'var(--theme-border)'}`,
          background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-primary)',
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          boxShadow: open ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
          transition: 'border-color .2s, box-shadow .2s'
        }}
      >
        <span>{selected?.name || 'Select Group'}</span>
        <ChevronDown size={15} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', opacity: 0.6 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
              background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)',
              borderRadius: 10, boxShadow: '0 12px 40px rgba(0,0,0,0.4)', overflow: 'hidden'
            }}
          >
            {groups.map(g => (
              <button key={g._id} onClick={() => { onChange(g._id); setOpen(false) }} style={{
                width: '100%', padding: '10px 14px', textAlign: 'left', background: g._id === value ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', color: g._id === value ? '#6366f1' : 'var(--theme-text-primary)',
                fontSize: 14, fontWeight: g._id === value ? 700 : 400,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background .1s'
              }}
                onMouseEnter={e => { if (g._id !== value)(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (g._id !== value)(e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                {g.name}
                {g._id === value && <Check size={14} style={{ color: '#6366f1' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const formatTime = (seconds: number): string => {
  if (seconds === 0 || isNaN(seconds)) return '0 seconds'
  const units = [
    { name: 'year', seconds: 365 * 24 * 60 * 60 },
    { name: 'month', seconds: 30 * 24 * 60 * 60 },
    { name: 'day', seconds: 24 * 60 * 60 },
    { name: 'hour', seconds: 60 * 60 },
    { name: 'minute', seconds: 60 },
    { name: 'second', seconds: 1 }
  ]
  const parts: string[] = []
  let rem = Math.floor(seconds)
  for (const u of units) {
    const c = Math.floor(rem / u.seconds)
    if (c > 0) { parts.push(`${c} ${u.name}${c > 1 ? 's' : ''}`); rem -= c * u.seconds }
  }
  return parts.join(', ') || '0 seconds'
}

const IBPartnersPage = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [ibConfigurations, setIbConfigurations] = useState<IBConfiguration[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentConfigId, setCurrentConfigId] = useState('')
  const [newLevel, setNewLevel] = useState('')
  const [newBonusPerLot, setNewBonusPerLot] = useState('')
  const [groupDefaultTime, setGroupDefaultTime] = useState(0)
  const [groupDefaultTimeInput, setGroupDefaultTimeInput] = useState('0')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        const fetchedGroups = await getGroups()
        const safeGroups = Array.isArray(fetchedGroups) ? fetchedGroups : []
        setGroups(safeGroups)
        if (safeGroups.length > 0) {
          setSelectedGroup(safeGroups[0]._id)
          const configs = await getIBConfigurationsByGroup(safeGroups[0]._id)
          const safeConfigs = Array.isArray(configs) ? configs : []
          setIbConfigurations(safeConfigs)
          const dt = safeConfigs.length > 0 ? (safeConfigs[0].defaultTimeInSeconds || 0) : 0
          setGroupDefaultTime(dt)
          setGroupDefaultTimeInput(dt.toString())
        } else { setIbConfigurations([]); setGroupDefaultTime(0); setGroupDefaultTimeInput('0') }
      } catch {
        setGroups([]); setIbConfigurations([])
        toast.error('Failed to load initial data')
      } finally { setLoading(false) }
    }
    fetchInitialData()
  }, [])

  const handleGroupChange = async (value: string) => {
    setSelectedGroup(value)
    try {
      setLoading(true)
      const configs = await getIBConfigurationsByGroup(value)
      const safeConfigs = Array.isArray(configs) ? configs : []
      setIbConfigurations(safeConfigs)
      const dt = safeConfigs.length > 0 ? (safeConfigs[0].defaultTimeInSeconds || 0) : 0
      setGroupDefaultTime(dt); setGroupDefaultTimeInput(dt.toString())
    } catch { toast.error('Failed to load configurations') }
    finally { setLoading(false) }
  }

  const handleUpdateGroupDefaultTime = async () => {
    const t = parseInt(groupDefaultTimeInput)
    if (isNaN(t) || t < 0) { toast.error('Please enter a valid number of seconds'); return }
    try {
      await updateGroupDefaultTime(selectedGroup, t)
      setGroupDefaultTime(t)
      const updated = await getIBConfigurationsByGroup(selectedGroup)
      setIbConfigurations(Array.isArray(updated) ? updated : [])
      toast.success('Default time updated successfully')
    } catch { toast.error('Failed to update default time') }
  }

  const handleAddConfig = () => {
    setIsEditMode(false); setCurrentConfigId(''); setNewLevel(''); setNewBonusPerLot(''); setIsDialogOpen(true)
  }

  const handleEditConfig = (config: IBConfiguration) => {
    setIsEditMode(true); setCurrentConfigId(config._id)
    setNewLevel(config.level.toString()); setNewBonusPerLot(config.bonusPerLot.toString()); setIsDialogOpen(true)
  }

  const handleSubmitConfig = async () => {
    if (!newLevel.trim() || !newBonusPerLot.trim()) { toast.error('Please fill all fields'); return }
    const level = parseInt(newLevel)
    const bonusPerLot = parseFloat(newBonusPerLot)
    if (isNaN(level) || level < 1 || level > 10) { toast.error('Level must be between 1 and 10'); return }
    if (isNaN(bonusPerLot) || bonusPerLot < 0) { toast.error('Bonus per lot must be a valid non-negative number'); return }
    try {
      if (isEditMode) {
        await updateIBConfiguration(currentConfigId, bonusPerLot)
        toast.success('IB configuration updated successfully')
      } else {
        await createIBConfiguration(selectedGroup, level, bonusPerLot)
        toast.success('IB configuration added successfully')
      }
      const updated = await getIBConfigurationsByGroup(selectedGroup)
      setIbConfigurations(Array.isArray(updated) ? updated : [])
      setIsDialogOpen(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save configuration')
    }
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px',
    borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all .15s'
  }

  // Stats
  const maxBonus = ibConfigurations.length > 0 ? Math.max(...ibConfigurations.map(c => c.bonusPerLot)) : 0

  return (
    <>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ padding: '24px 28px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--theme-text-primary)', margin: 0 }}>IB Commission Configuration</h1>
            <p style={{ fontSize: 14, color: 'var(--theme-text-muted)', marginTop: 4 }}>Manage commission rates for Introducing Broker partners</p>
          </div>
          {groups.length > 0 && (
            <GroupSelect groups={groups} value={selectedGroup} onChange={handleGroupChange} />
          )}
        </div>

        {/* Stats Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Groups', value: groups.length, icon: <Users size={20} />, color: '#6366f1' },
            { label: 'IB Levels', value: ibConfigurations.length, icon: <Award size={20} />, color: '#10b981' },
            { label: 'Max Bonus/Lot', value: `$${maxBonus.toFixed(2)}`, icon: <TrendingUp size={20} />, color: '#f59e0b' },
            { label: 'Default Time', value: groupDefaultTime > 0 ? formatTime(groupDefaultTime).split(',')[0] : 'None', icon: <Clock size={20} />, color: '#8b5cf6' },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{
                background: 'var(--theme-bg-card)', borderRadius: 12, border: '1px solid var(--theme-border)',
                padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--theme-text-primary)', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--theme-text-muted)', marginTop: 3 }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Default Time Config Card */}
        {selectedGroup && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--theme-bg-card)', borderRadius: 16,
              border: '1px solid var(--theme-border)', marginBottom: 20, overflow: 'hidden'
            }}
          >
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#8b5cf618', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                <Clock size={17} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--theme-text-primary)' }}>Group Default Time</div>
                <div style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Configure the default commission calculation period</div>
              </div>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'end', maxWidth: 600 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
                    Default Time (seconds)
                  </label>
                  <input type="number" min="0" value={groupDefaultTimeInput}
                    onChange={e => setGroupDefaultTimeInput(e.target.value)}
                    placeholder="Enter time in seconds"
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: 9,
                      border: '1px solid var(--theme-border)', background: 'rgba(255,255,255,0.05)',
                      color: 'var(--theme-text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                    }}
                    onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                    onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
                  />
                </div>
                <button onClick={handleUpdateGroupDefaultTime}
                  disabled={loading || !groupDefaultTimeInput.trim()}
                  style={{ ...btnBase, background: '#8b5cf6', color: '#fff', opacity: (loading || !groupDefaultTimeInput.trim()) ? 0.5 : 1 }}
                  onMouseEnter={e => { if (!loading)(e.currentTarget as HTMLButtonElement).style.background = '#7c3aed' }}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#8b5cf6'}
                >
                  <Check size={15} />Update Time
                </button>
              </div>
              <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(139,92,246,0.08)', borderRadius: 9, border: '1px solid rgba(139,92,246,0.2)' }}>
                <span style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>Current: </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-primary)' }}>{formatTime(groupDefaultTime)}</span>
                {groupDefaultTimeInput.trim() && parseInt(groupDefaultTimeInput) !== groupDefaultTime && (
                  <>
                    <span style={{ fontSize: 12, color: 'var(--theme-text-muted)', marginLeft: 16 }}>Preview: </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6' }}>{formatTime(parseInt(groupDefaultTimeInput) || 0)}</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* IB Configuration Table */}
        <div style={{
          background: 'var(--theme-bg-card)', borderRadius: 16,
          border: '1px solid var(--theme-border)', overflow: 'hidden'
        }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#6366f118', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                <Award size={17} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--theme-text-primary)' }}>IB Commission Levels</div>
                <div style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>
                  {selectedGroup ? `${ibConfigurations.length} levels for selected group` : 'Select a group to view levels'}
                </div>
              </div>
            </div>
            <button onClick={handleAddConfig} disabled={!selectedGroup || loading} style={{
              ...btnBase, background: '#6366f1', color: '#fff', opacity: (!selectedGroup || loading) ? 0.5 : 1
            }}
              onMouseEnter={e => { if (selectedGroup && !loading)(e.currentTarget as HTMLButtonElement).style.background = '#4f46e5' }}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#6366f1'}
            >
              <PlusCircle size={15} />Add Level
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--theme-border)' }}>
                  {['Level', 'Bonus per Lot', 'Default Time', 'Actions'].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 20px', textAlign: i === 3 ? 'right' : 'left',
                      fontSize: 11, fontWeight: 700, color: 'var(--theme-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      background: 'rgba(255,255,255,0.02)'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--theme-border)' }}>
                      {[1, 2, 3, 4].map(j => (
                        <td key={j} style={{ padding: '16px 20px' }}>
                          <div style={{ height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !selectedGroup ? (
                  <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--theme-text-muted)' }}>Select a group to view configurations</td></tr>
                ) : ibConfigurations.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--theme-text-muted)' }}>No configurations found for this group</td></tr>
                ) : (
                  ibConfigurations.map((config, idx) => {
                    const levelColors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16']
                    const col = levelColors[(config.level - 1) % levelColors.length]
                    return (
                      <motion.tr key={config._id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                        onMouseEnter={() => setHoveredRow(config._id)} onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          borderBottom: '1px solid var(--theme-border)',
                          background: hoveredRow === config._id ? 'rgba(255,255,255,0.03)' : 'transparent',
                          transition: 'background .15s'
                        }}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 38, height: 38, borderRadius: 9, background: col + '18',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, fontWeight: 800, color: col
                            }}>L{config.level}</div>
                            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--theme-text-primary)' }}>Level {config.level}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>$</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{config.bonusPerLot.toFixed(2)}</span>
                            <span style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>/ lot</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={13} style={{ color: 'var(--theme-text-muted)' }} />
                            <span style={{ fontSize: 13, color: 'var(--theme-text-primary)' }}>{formatTime(config.defaultTimeInSeconds || 0)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button onClick={() => handleEditConfig(config)} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                            borderRadius: 8, border: '1px solid var(--theme-border)', background: 'transparent',
                            cursor: 'pointer', color: 'var(--theme-text-muted)', fontSize: 13, fontWeight: 600, transition: 'all .15s'
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#6366f118'; (e.currentTarget as HTMLButtonElement).style.color = '#6366f1'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#6366f160' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--theme-text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--theme-border)' }}
                          >
                            <Pencil size={13} />Edit
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ─────────────────────────────────────────────────────── */}
      <Modal open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--theme-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: '#6366f118', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              {isEditMode ? <Pencil size={17} /> : <PlusCircle size={17} />}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--theme-text-primary)' }}>
                {isEditMode ? 'Edit IB Level' : 'Add New IB Level'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--theme-text-muted)' }}>
                {isEditMode ? 'Update the bonus amount for this level' : 'Add a new level and bonus for the selected group'}
              </div>
            </div>
          </div>
          <button onClick={() => setIsDialogOpen(false)} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--theme-border)',
            background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-text-muted)'
          }}><X size={16} /></button>
        </div>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
              Level (1–10)
            </label>
            <input type="number" min="1" max="10" value={newLevel}
              onChange={e => setNewLevel(e.target.value)}
              disabled={isEditMode}
              placeholder="Enter level (1-10)"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 9,
                border: '1px solid var(--theme-border)', background: isEditMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                color: isEditMode ? 'var(--theme-text-muted)' : 'var(--theme-text-primary)',
                fontSize: 14, outline: 'none', boxSizing: 'border-box'
              }}
              onFocus={e => !isEditMode && (e.target.style.borderColor = '#6366f1')}
              onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>
              Bonus per Lot ($)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#10b981', fontWeight: 700 }}>$</span>
              <input type="number" step="0.01" min="0" value={newBonusPerLot}
                onChange={e => setNewBonusPerLot(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%', padding: '10px 14px 10px 28px', borderRadius: 9,
                  border: '1px solid var(--theme-border)', background: 'rgba(255,255,255,0.05)',
                  color: 'var(--theme-text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = 'var(--theme-border)'}
              />
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--theme-border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={() => setIsDialogOpen(false)} style={{
            ...btnBase, background: 'rgba(255,255,255,0.05)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)'
          }}>Cancel</button>
          <button onClick={handleSubmitConfig} style={{ ...btnBase, background: '#6366f1', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#4f46e5'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#6366f1'}
          >
            <Check size={15} />{isEditMode ? 'Update Level' : 'Add Level'}
          </button>
        </div>
      </Modal>
    </>
  )
}

export default IBPartnersPage
