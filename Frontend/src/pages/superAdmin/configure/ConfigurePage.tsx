import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, Layers, Sliders, ChevronRight } from "lucide-react"
import LeverageAndGroup from "./components/leverageGroup"
import ConfigureValues from "./components/ConfigureValues"

type Tab = "leverage" | "configure"

const tabs: { id: Tab; label: string; desc: string; icon: React.ElementType }[] = [
    { id: "leverage",  label: "Leverage & Groups", desc: "Manage trading leverage ratios and account groups", icon: Layers },
    { id: "configure", label: "System Values",     desc: "Platform settings, branding, and contact details",  icon: Sliders },
]

export default function SuperadminConfigurationPage() {
    const [activeTab, setActiveTab] = useState<Tab>("leverage")

    return (
        <div className="min-h-screen pb-8">
            {/* ── Hero Header ───────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="relative overflow-hidden rounded-2xl p-6 mb-6"
                style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 20%, var(--theme-bg-card)) 0%, var(--theme-bg-card) 65%)",
                    border: "1px solid var(--theme-border)",
                }}
            >
                {/* decorative blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.05] -translate-y-24 translate-x-24"
                    style={{ background: "var(--theme-primary)" }} />
                <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full opacity-[0.04] translate-y-12"
                    style={{ background: "var(--theme-primary)" }} />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ background: "linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 60%, #8b5cf6))" }}>
                        <Settings className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: "var(--theme-text-primary)" }}>
                            System Configuration
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: "var(--theme-text-muted)" }}>
                            Manage leverage ratios, trading groups, and platform-wide settings
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* ── Tab Selector ──────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex gap-2 p-1.5 rounded-2xl mb-6"
                style={{ background: "var(--theme-bg-card)", border: "1px solid var(--theme-border)" }}
            >
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="relative flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors duration-200"
                            style={{ color: isActive ? "white" : "var(--theme-text-muted)" }}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabBg"
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                        background: "linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 65%, #8b5cf6))",
                                        boxShadow: "0 4px 20px color-mix(in srgb, var(--theme-primary) 35%, transparent)",
                                    }}
                                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                                />
                            )}
                            <div className="relative z-10 flex items-center gap-3 w-full">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                                    style={{ background: isActive ? "rgba(255,255,255,0.18)" : "color-mix(in srgb, var(--theme-primary) 12%, transparent)" }}>
                                    <Icon className="w-4 h-4" style={{ color: isActive ? "white" : "var(--theme-primary)" }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-tight">{tab.label}</p>
                                    <p className="text-[11px] opacity-70 leading-tight hidden sm:block">{tab.desc}</p>
                                </div>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-60 flex-shrink-0" />}
                            </div>
                        </button>
                    )
                })}
            </motion.div>

            {/* ── Tab Content ───────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                >
                    {activeTab === "leverage" ? <LeverageAndGroup /> : <ConfigureValues />}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
