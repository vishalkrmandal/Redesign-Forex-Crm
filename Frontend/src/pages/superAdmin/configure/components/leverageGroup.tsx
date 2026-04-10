"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusCircle, Pencil, Trash2, Zap, Layers, CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const SectionHeader = ({
    title, subtitle, icon: Icon, accent, count, onAdd,
}: {
    title: string; subtitle: string; icon: React.ElementType
    accent: string; count: number; onAdd: () => void
}) => (
    <div className="relative overflow-hidden rounded-2xl p-5 mb-4"
        style={{
            background: `linear-gradient(135deg, ${accent}18 0%, color-mix(in srgb, ${accent} 6%, var(--theme-bg-card)) 100%)`,
            border: `1px solid ${accent}30`,
        }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.06] -translate-y-14 translate-x-14"
            style={{ background: accent }} />
        <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, #8b5cf6))` }}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold" style={{ color: "var(--theme-text-primary)" }}>{title}</h2>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${accent}20`, color: accent }}>
                            {count}
                        </span>
                    </div>
                    <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>{subtitle}</p>
                </div>
            </div>
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, #8b5cf6))` }}
            >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add New</span>
            </motion.button>
        </div>
    </div>
)

const EmptyState = ({ label, accent }: { label: string; accent: string }) => (
    <div className="flex flex-col items-center justify-center py-14 rounded-2xl"
        style={{ border: `1.5px dashed ${accent}40`, background: `${accent}05` }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: `${accent}15` }}>
            <Layers className="w-6 h-6" style={{ color: accent }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--theme-text-muted)" }}>No {label} yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--theme-text-disabled)" }}>Click "Add New" to create one</p>
    </div>
)

// ─── Leverage Card ────────────────────────────────────────────────────────────

const LeverageCard = ({
    leverage, index, onEdit, onDelete,
}: {
    leverage: { _id: number; value: string; name: string; active: boolean }
    index: number; onEdit: () => void; onDelete: () => void
}) => {
    const accent = "#6366f1"
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ delay: index * 0.04 }}
            className="relative group rounded-2xl p-4 transition-all duration-200"
            style={{
                background: "var(--theme-bg-card)",
                border: "1.5px solid var(--theme-border)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}50` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-border)" }}
        >
            {/* accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, ${accent}, #8b5cf6)` }} />

            <div className="flex items-start justify-between mb-3">
                {/* Leverage ratio badge */}
                <div className="px-3 py-1.5 rounded-xl"
                    style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
                    <span className="text-lg font-black font-mono" style={{ color: accent }}>
                        {leverage.value || "—"}
                    </span>
                </div>
                {/* Status */}
                {leverage.active
                    ? <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#10b98118", color: "#10b981" }}>
                        <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                    : <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#ef444418", color: "#ef4444" }}>
                        <XCircle className="w-3 h-3" /> Inactive
                    </span>
                }
            </div>

            <p className="text-sm font-semibold mb-4" style={{ color: "var(--theme-text-primary)" }}>
                {leverage.name || <span style={{ color: "var(--theme-text-disabled)" }}>—</span>}
            </p>

            <div className="flex gap-2">
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}
                >
                    <Pencil className="w-3 h-3" /> Edit
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onDelete}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: "#ef444412", color: "#ef4444", border: "1px solid #ef444425" }}
                >
                    <Trash2 className="w-3 h-3" /> Delete
                </motion.button>
            </div>
        </motion.div>
    )
}

// ─── Group Card ───────────────────────────────────────────────────────────────

const GroupCard = ({
    group, index, onEdit, onDelete,
}: {
    group: { _id: number; name: string; value: string; description: string }
    index: number; onEdit: () => void; onDelete: () => void
}) => {
    const accent = "#10b981"
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ delay: index * 0.04 }}
            className="relative group rounded-2xl p-4 transition-all duration-200"
            style={{ background: "var(--theme-bg-card)", border: "1.5px solid var(--theme-border)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}50` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-border)" }}
        >
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, ${accent}, #06b6d4)` }} />

            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent }} />
                <p className="text-sm font-bold truncate" style={{ color: "var(--theme-text-primary)" }}>
                    {group.name || "—"}
                </p>
            </div>

            <p className="text-[11px] font-mono mb-1 truncate px-2 py-1 rounded-lg"
                style={{ background: `${accent}10`, color: accent }}>
                {group.value || "—"}
            </p>

            {group.description && (
                <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--theme-text-muted)" }}>
                    {group.description}
                </p>
            )}

            <div className="flex gap-2 mt-4">
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: `${accent}12`, color: accent, border: `1px solid ${accent}25` }}
                >
                    <Pencil className="w-3 h-3" /> Edit
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onDelete}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "#ef444412", color: "#ef4444", border: "1px solid #ef444425" }}
                >
                    <Trash2 className="w-3 h-3" /> Delete
                </motion.button>
            </div>
        </motion.div>
    )
}

// ─── Confirm Delete Dialog ─────────────────────────────────────────────────────

const ConfirmDelete = ({
    open, onOpenChange, label, onConfirm,
}: { open: boolean; onOpenChange: (v: boolean) => void; label: string; onConfirm: () => void }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "#ef444420" }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </div>
                    Confirm Delete
                </DialogTitle>
            </DialogHeader>
            <p className="text-sm py-2" style={{ color: "var(--theme-text-muted)" }}>
                Are you sure you want to delete this <strong>{label}</strong>? This action cannot be undone.
            </p>
            <DialogFooter className="gap-2">
                <button onClick={() => onOpenChange(false)}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={{ border: "1px solid var(--theme-border)", color: "var(--theme-text-muted)" }}>
                    Cancel
                </button>
                <button onClick={onConfirm}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                    Delete
                </button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeverageAndGroup() {
    const [leverages, setLeverages] = useState<{ _id: number; value: string; name: string; active: boolean }[]>([])
    const [groups, setGroups]       = useState<{ _id: number; name: string; value: string; description: string }[]>([])
    const [mt5Groups, setMt5Groups] = useState<{ lstGroup: string }[]>([])

    const [isLevDialogOpen, setIsLevDialogOpen]     = useState(false)
    const [isLevDeleteOpen, setIsLevDeleteOpen]     = useState(false)
    const [currentLev, setCurrentLev]               = useState<any>(null)

    const [isGrpDialogOpen, setIsGrpDialogOpen]     = useState(false)
    const [isGrpDeleteOpen, setIsGrpDeleteOpen]     = useState(false)
    const [currentGrp, setCurrentGrp]               = useState<any>(null)

    useEffect(() => { fetchLeverages(); fetchGroups() }, [])

    // ── API helpers ──────────────────────────────────────────────────────────

    const token = () => localStorage.getItem("superadminToken") ?? ""

    const fetchLeverages = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/leverages`, { headers: { Authorization: `Bearer ${token()}` } })
            setLeverages(res.data.data)
        } catch { toast.error("Failed to load leverages") }
    }

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/groups`, { headers: { Authorization: `Bearer ${token()}` } })
            setGroups(res.data.data)
        } catch { toast.error("Failed to load groups") }
    }

    const fetchMt5Groups = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/groups/mt5-groups`, { headers: { Authorization: `Bearer ${token()}` } })
            setMt5Groups(res.data.data.lstGroups.map((g: string) => ({ lstGroup: g })))
        } catch { toast.error("Failed to load MT5 groups") }
    }

    // ── Leverage CRUD ─────────────────────────────────────────────────────────

    const saveLeverage = async () => {
        try {
            if (currentLev?._id) {
                await axios.put(`${API_BASE_URL}/api/leverages/${currentLev._id}`, currentLev, { headers: { Authorization: `Bearer ${token()}` } })
                toast.success("Leverage updated")
            } else {
                await axios.post(`${API_BASE_URL}/api/leverages`, currentLev, { headers: { Authorization: `Bearer ${token()}` } })
                toast.success("Leverage created")
            }
            fetchLeverages(); setIsLevDialogOpen(false)
        } catch { toast.error("Failed to save leverage") }
    }

    const deleteLeverage = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/leverages/${currentLev._id}`, { headers: { Authorization: `Bearer ${token()}` } })
            toast.success("Leverage deleted"); fetchLeverages(); setIsLevDeleteOpen(false)
        } catch { toast.error("Failed to delete leverage") }
    }

    // ── Group CRUD ────────────────────────────────────────────────────────────

    const saveGroup = async () => {
        try {
            if (currentGrp?._id) {
                await axios.put(`${API_BASE_URL}/api/groups/${currentGrp._id}`, currentGrp, { headers: { Authorization: `Bearer ${token()}` } })
                toast.success("Group updated")
            } else {
                await axios.post(`${API_BASE_URL}/api/groups`, currentGrp, { headers: { Authorization: `Bearer ${token()}` } })
                toast.success("Group created")
            }
            fetchGroups(); setIsGrpDialogOpen(false)
        } catch { toast.error("Failed to save group") }
    }

    const deleteGroup = async () => {
        try {
            await axios.delete(`${API_BASE_URL}/api/groups/${currentGrp._id}`, { headers: { Authorization: `Bearer ${token()}` } })
            toast.success("Group deleted"); fetchGroups(); setIsGrpDeleteOpen(false)
        } catch { toast.error("Failed to delete group") }
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8">

            {/* ── Leverages Section ──────────────────────────────────────── */}
            <div>
                <SectionHeader
                    title="Leverage Ratios" subtitle="Configure available leverage options for trading accounts"
                    icon={Zap} accent="#6366f1" count={leverages.length}
                    onAdd={() => { setCurrentLev({ value: "", name: "", active: false }); setIsLevDialogOpen(true) }}
                />

                {leverages.length === 0
                    ? <EmptyState label="leverages" accent="#6366f1" />
                    : (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                            <AnimatePresence>
                                {leverages.map((lev, i) => (
                                    <LeverageCard key={lev._id} leverage={lev} index={i}
                                        onEdit={() => { setCurrentLev(lev); setIsLevDialogOpen(true) }}
                                        onDelete={() => { setCurrentLev(lev); setIsLevDeleteOpen(true) }}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )
                }
            </div>

            {/* ── Groups Section ─────────────────────────────────────────── */}
            <div>
                <SectionHeader
                    title="Account Groups" subtitle="Manage MT5 trading groups assigned to client accounts"
                    icon={Layers} accent="#10b981" count={groups.length}
                    onAdd={() => { fetchMt5Groups(); setCurrentGrp({ name: "", value: "", description: "" }); setIsGrpDialogOpen(true) }}
                />

                {groups.length === 0
                    ? <EmptyState label="groups" accent="#10b981" />
                    : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            <AnimatePresence>
                                {groups.map((grp, i) => (
                                    <GroupCard key={grp._id} group={grp} index={i}
                                        onEdit={() => { fetchMt5Groups(); setCurrentGrp(grp); setIsGrpDialogOpen(true) }}
                                        onDelete={() => { setCurrentGrp(grp); setIsGrpDeleteOpen(true) }}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )
                }
            </div>

            {/* ── Leverage Add/Edit Dialog ───────────────────────────────── */}
            <Dialog open={isLevDialogOpen} onOpenChange={setIsLevDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "#6366f115" }}>
                                <Zap className="w-4 h-4" style={{ color: "#6366f1" }} />
                            </div>
                            {currentLev?._id ? "Edit Leverage" : "Add New Leverage"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Value <span style={{ color: "var(--theme-text-disabled)", fontSize: 11 }}>(e.g. 1:100)</span></Label>
                            <Input placeholder="1:100" value={currentLev?.value || ""}
                                onChange={(e) => setCurrentLev({ ...currentLev, value: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Display Name</Label>
                            <Input placeholder="Standard" value={currentLev?.name || ""}
                                onChange={(e) => setCurrentLev({ ...currentLev, name: e.target.value })} />
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)" }}>
                            <Checkbox id="lev-active" checked={currentLev?.active || false}
                                onCheckedChange={(v) => setCurrentLev({ ...currentLev, active: !!v })} />
                            <label htmlFor="lev-active" className="text-sm font-medium cursor-pointer select-none"
                                style={{ color: "var(--theme-text-primary)" }}>
                                Mark as Active
                            </label>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <button onClick={() => setIsLevDialogOpen(false)}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold"
                            style={{ border: "1px solid var(--theme-border)", color: "var(--theme-text-muted)" }}>
                            Cancel
                        </button>
                        <button onClick={saveLeverage}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                            <ChevronRight className="w-4 h-4" />
                            {currentLev?._id ? "Save Changes" : "Create"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Group Add/Edit Dialog ──────────────────────────────────── */}
            <Dialog open={isGrpDialogOpen} onOpenChange={setIsGrpDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "#10b98115" }}>
                                <Layers className="w-4 h-4" style={{ color: "#10b981" }} />
                            </div>
                            {currentGrp?._id ? "Edit Group" : "Add New Group"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Name</Label>
                            <Input placeholder="Standard Group" value={currentGrp?.name || ""}
                                onChange={(e) => setCurrentGrp({ ...currentGrp, name: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>MT5 Group Value</Label>
                            <select value={currentGrp?.value || ""}
                                onChange={(e) => setCurrentGrp({ ...currentGrp, value: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Select MT5 group…</option>
                                {mt5Groups.map((g) => (
                                    <option key={g.lstGroup} value={g.lstGroup}>{g.lstGroup}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description <span style={{ color: "var(--theme-text-disabled)", fontSize: 11 }}>(optional)</span></Label>
                            <Textarea placeholder="Brief description of this group…" value={currentGrp?.description || ""}
                                onChange={(e) => setCurrentGrp({ ...currentGrp, description: e.target.value })}
                                className="resize-none" rows={3} />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <button onClick={() => setIsGrpDialogOpen(false)}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold"
                            style={{ border: "1px solid var(--theme-border)", color: "var(--theme-text-muted)" }}>
                            Cancel
                        </button>
                        <button onClick={saveGroup}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                            <ChevronRight className="w-4 h-4" />
                            {currentGrp?._id ? "Save Changes" : "Create"}
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmations ───────────────────────────────────── */}
            <ConfirmDelete open={isLevDeleteOpen} onOpenChange={setIsLevDeleteOpen}
                label="leverage" onConfirm={deleteLeverage} />
            <ConfirmDelete open={isGrpDeleteOpen} onOpenChange={setIsGrpDeleteOpen}
                label="group" onConfirm={deleteGroup} />
        </div>
    )
}
