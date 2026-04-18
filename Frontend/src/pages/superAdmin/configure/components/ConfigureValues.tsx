"use client"

import type React from "react"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Server, Tag, Mail, Phone, MessageCircle,
    ImageIcon, Star, FileText, Pencil, Upload,
    Settings2, Images, ChevronRight, Eye,
} from "lucide-react"

// ─── Static data ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
    "Server Name": Server,
    "KYC doc-1 Label": Tag,
    "KYC doc-2 Label": Tag,
    "KYC doc-3 Label": Tag,
    "Company Email": Mail,
    "Company Contact No.": Phone,
    "Whatsapp contact": MessageCircle,
}

const initialDetails = [
    { id: 1, name: "Server Name", value: "prod-server-01", description: "Production server hostname" },
    { id: 2, name: "KYC doc-1 Label", value: "Government ID", description: "Primary identification document" },
    { id: 3, name: "KYC doc-2 Label", value: "Proof of Address", description: "Utility bill or bank statement" },
    { id: 4, name: "KYC doc-3 Label", value: "Selfie with ID", description: "Photo holding government ID" },
    { id: 5, name: "Company Email", value: "support@example.com", description: "Primary contact email" },
    { id: 6, name: "Company Contact No.", value: "+1 (555) 123-4567", description: "Customer support number" },
    { id: 7, name: "Whatsapp contact", value: "+1 (555) 987-6543", description: "WhatsApp business account" },
]

const initialFiles = [
    { id: 1, name: "Company Logo", value: "/placeholder.svg?height=100&width=200", description: "Main brand logo", icon: ImageIcon },
    { id: 2, name: "Favicon", value: "/placeholder.svg?height=32&width=32", description: "Website favicon (32×32)", icon: Star },
    { id: 3, name: "Terms Document", value: "/placeholder.svg?height=150&width=120", description: "Terms and conditions PDF", icon: FileText },
]

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({
    title, subtitle, icon: Icon, accent,
}: { title: string; subtitle: string; icon: React.ElementType; accent: string }) => (
    <div className="relative overflow-hidden rounded-2xl p-5 mb-4"
        style={{
            background: `linear-gradient(135deg, ${accent}18 0%, color-mix(in srgb, ${accent} 6%, var(--theme-bg-card)) 100%)`,
            border: `1px solid ${accent}30`,
        }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.06] -translate-y-14 translate-x-14"
            style={{ background: accent }} />
        <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, #06b6d4))` }}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <h2 className="text-base font-bold" style={{ color: "var(--theme-text-primary)" }}>{title}</h2>
                <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>{subtitle}</p>
            </div>
        </div>
    </div>
)

// ─── Detail Card ──────────────────────────────────────────────────────────────

const DetailCard = ({
    detail, index, onEdit,
}: { detail: typeof initialDetails[0]; index: number; onEdit: () => void }) => {
    const Icon = ICON_MAP[detail.name] || Settings2
    const accent = "#6366f1"

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-200"
            style={{
                background: "var(--theme-bg-card)",
                border: "1.5px solid var(--theme-border)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}40` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-border)" }}
        >
            {/* index chip */}
            <span className="absolute top-2 left-2 text-[9px] font-bold px-1 py-0.5 rounded"
                style={{ background: `${accent}15`, color: accent }}>
                {String(index + 1).padStart(2, "0")}
            </span>

            <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-1"
                style={{ background: `${accent}12` }}>
                <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5"
                    style={{ color: "var(--theme-text-muted)" }}>
                    {detail.name}
                </p>
                <p className="text-sm font-bold truncate" style={{ color: "var(--theme-text-primary)" }}>
                    {detail.value}
                </p>
                <p className="text-[11px] truncate" style={{ color: "var(--theme-text-disabled)" }}>
                    {detail.description}
                </p>
            </div>

            <motion.button
                whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                onClick={onEdit}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `${accent}15`, color: accent }}
            >
                <Pencil className="w-3.5 h-3.5" />
            </motion.button>
        </motion.div>
    )
}

// ─── File Asset Card ──────────────────────────────────────────────────────────

const FileCard = ({
    file, index, onEdit,
}: { file: typeof initialFiles[0]; index: number; onEdit: () => void }) => {
    const accent = "#f59e0b"
    const Icon = file.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="group rounded-2xl overflow-hidden transition-all duration-200"
            style={{ background: "var(--theme-bg-card)", border: "1.5px solid var(--theme-border)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}50` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--theme-border)" }}
        >
            {/* Preview area */}
            <div className="relative h-28 flex items-center justify-center overflow-hidden"
                style={{ background: `${accent}08` }}>
                <img src={file.value} alt={file.name}
                    className="h-full w-full object-contain p-3"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none" }} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.35)" }}>
                    <button onClick={() => window.open(file.value, "_blank")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: "rgba(0,0,0,0.5)" }}>
                        <Eye className="w-3 h-3" /> Preview
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: `${accent}15` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                    </div>
                    <p className="text-sm font-bold truncate" style={{ color: "var(--theme-text-primary)" }}>
                        {file.name}
                    </p>
                </div>
                <p className="text-[11px] mb-3" style={{ color: "var(--theme-text-disabled)" }}>
                    {file.description}
                </p>
                <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={onEdit}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}
                >
                    <Upload className="w-3.5 h-3.5" /> Replace File
                </motion.button>
            </div>
        </motion.div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConfigureValues() {
    const [details, setDetails] = useState(initialDetails)
    const [files, setFiles] = useState(initialFiles)

    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isFileOpen, setIsFileOpen] = useState(false)
    const [currentDetail, setCurrentDetail] = useState<any>(null)
    const [currentFile, setCurrentFile] = useState<any>(null)
    const [previewUrl, setPreviewUrl] = useState("")

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setPreviewUrl(URL.createObjectURL(e.target.files[0]))
        }
    }

    const saveDetail = () => {
        setDetails(details.map((d) => d.id === currentDetail.id ? currentDetail : d))
        setIsDetailOpen(false)
    }

    const saveFile = () => {
        setFiles(files.map((f) => f.id === currentFile.id ? { ...currentFile, value: previewUrl || currentFile.value } : f))
        setIsFileOpen(false)
    }

    return (
        <div className="space-y-8">

            {/* ── System Values Section ───────────────────────────────────── */}
            <div>
                <SectionHeader
                    title="System Configuration Values"
                    subtitle="Platform-wide settings, server info, and contact details"
                    icon={Settings2} accent="#6366f1"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AnimatePresence>
                        {details.map((detail, i) => (
                            <DetailCard key={detail.id} detail={detail} index={i}
                                onEdit={() => { setCurrentDetail({ ...detail }); setIsDetailOpen(true) }} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Brand Assets Section ─────────────────────────────────────── */}
            <div>
                <SectionHeader
                    title="Brand Assets & Files"
                    subtitle="Upload logos, favicons, and legal documents for your platform"
                    icon={Images} accent="#f59e0b"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {files.map((file, i) => (
                            <FileCard key={file.id} file={file} index={i}
                                onEdit={() => { setCurrentFile({ ...file }); setPreviewUrl(file.value); setIsFileOpen(true) }} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Edit Detail Dialog ────────────────────────────────────────── */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "#6366f115" }}>
                                <Settings2 className="w-4 h-4" style={{ color: "#6366f1" }} />
                            </div>
                            Update Configuration
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Setting</Label>
                            <Input value={currentDetail?.name || ""} readOnly
                                className="opacity-60 cursor-not-allowed" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Value</Label>
                            <Input value={currentDetail?.value || ""}
                                onChange={(e) => setCurrentDetail({ ...currentDetail, value: e.target.value })}
                                placeholder="Enter value…" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description <span style={{ color: "var(--theme-text-disabled)", fontSize: 11 }}>(optional)</span></Label>
                            <Textarea value={currentDetail?.description || ""}
                                onChange={(e) => setCurrentDetail({ ...currentDetail, description: e.target.value })}
                                placeholder="Brief description…" className="resize-none" rows={2} />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <button onClick={() => setIsDetailOpen(false)}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold"
                            style={{ border: "1px solid var(--theme-border)", color: "var(--theme-text-muted)" }}>
                            Cancel
                        </button>
                        <button onClick={saveDetail}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                            <ChevronRight className="w-4 h-4" /> Save
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Edit File Dialog ──────────────────────────────────────────── */}
            <Dialog open={isFileOpen} onOpenChange={setIsFileOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "#f59e0b15" }}>
                                <Images className="w-4 h-4" style={{ color: "#f59e0b" }} />
                            </div>
                            Replace {currentFile?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Preview */}
                        {previewUrl && (
                            <div className="flex items-center justify-center h-32 rounded-xl overflow-hidden"
                                style={{ background: "var(--theme-bg-main)", border: "1px solid var(--theme-border)" }}>
                                <img src={previewUrl} alt="Preview"
                                    className="max-h-full max-w-full object-contain p-2" />
                            </div>
                        )}
                        {/* Upload trigger */}
                        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" />
                        <motion.button
                            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-dashed transition-colors"
                            style={{ borderColor: "#f59e0b60", color: "#f59e0b", background: "#f59e0b08" }}
                        >
                            <Upload className="w-4 h-4" />
                            Choose File to Upload
                        </motion.button>
                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label>Description <span style={{ color: "var(--theme-text-disabled)", fontSize: 11 }}>(optional)</span></Label>
                            <Textarea value={currentFile?.description || ""}
                                onChange={(e) => setCurrentFile({ ...currentFile, description: e.target.value })}
                                className="resize-none" rows={2} />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <button onClick={() => setIsFileOpen(false)}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold"
                            style={{ border: "1px solid var(--theme-border)", color: "var(--theme-text-muted)" }}>
                            Cancel
                        </button>
                        <button onClick={saveFile}
                            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
                            <Upload className="w-4 h-4" /> Upload
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
