// Frontend/src/pages/superAdmin/ThemeSettingsPage.tsx
"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Palette, RotateCcw, Save, Check } from "lucide-react"
import { useTheme, DEFAULT_COLORS, applyThemeVars, type ThemeColors } from "@/context/ThemeContext"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"

// ─── Preset Themes ────────────────────────────────────────────────────────────
const PRESETS: { name: string; emoji: string; colors: ThemeColors }[] = [
  {
    name: "Navy Gold",
    emoji: "🌊",
    colors: {
      primaryColor:  "#3B82F6",
      primaryHover:  "#2563EB",
      highlight:     "#F59E0B",
      bgMain:        "#0A0E1A",
      bgSidebar:     "#0D1226",
      bgCard:        "#111827",
      textPrimary:   "#FFFFFF",
      textMuted:     "#9CA3AF",
      textDisabled:  "#6B7280",
      success:       "#10B981",
      danger:        "#EF4444",
      warning:       "#F59E0B",
      info:          "#3B82F6",
      borderColor:   "#1F2937",
    },
  },
  {
    name: "Dark Green",
    emoji: "🌿",
    colors: {
      primaryColor:  "#10B981",
      primaryHover:  "#059669",
      highlight:     "#34D399",
      bgMain:        "#071812",
      bgSidebar:     "#0A1F1A",
      bgCard:        "#0D2820",
      textPrimary:   "#ECFDF5",
      textMuted:     "#6EE7B7",
      textDisabled:  "#4B9E7A",
      success:       "#22C55E",
      danger:        "#EF4444",
      warning:       "#FBBF24",
      info:          "#10B981",
      borderColor:   "#064E3B",
    },
  },
  {
    name: "Deep Blue",
    emoji: "🔮",
    colors: {
      primaryColor:  "#6366F1",
      primaryHover:  "#4F46E5",
      highlight:     "#818CF8",
      bgMain:        "#06070F",
      bgSidebar:     "#090B1A",
      bgCard:        "#0F1221",
      textPrimary:   "#EEF2FF",
      textMuted:     "#A5B4FC",
      textDisabled:  "#6B73C8",
      success:       "#10B981",
      danger:        "#EF4444",
      warning:       "#F59E0B",
      info:          "#6366F1",
      borderColor:   "#1E1B4B",
    },
  },
  {
    name: "Light Pro",
    emoji: "☀️",
    colors: {
      primaryColor:  "#2563EB",
      primaryHover:  "#1D4ED8",
      highlight:     "#F59E0B",
      bgMain:        "#F8FAFC",
      bgSidebar:     "#F1F5F9",
      bgCard:        "#FFFFFF",
      textPrimary:   "#1E293B",
      textMuted:     "#64748B",
      textDisabled:  "#94A3B8",
      success:       "#16A34A",
      danger:        "#DC2626",
      warning:       "#D97706",
      info:          "#2563EB",
      borderColor:   "#E2E8F0",
    },
  },
]

// ─── Color Groups ──────────────────────────────────────────────────────────────
const COLOR_GROUPS: { label: string; keys: { key: keyof ThemeColors; label: string }[] }[] = [
  {
    label: "Brand Colors",
    keys: [
      { key: "primaryColor",  label: "Primary" },
      { key: "primaryHover",  label: "Primary Hover" },
      { key: "highlight",     label: "Highlight / Accent" },
    ],
  },
  {
    label: "Backgrounds",
    keys: [
      { key: "bgMain",    label: "Main Background" },
      { key: "bgSidebar", label: "Sidebar Background" },
      { key: "bgCard",    label: "Card Background" },
    ],
  },
  {
    label: "Text",
    keys: [
      { key: "textPrimary",   label: "Primary Text" },
      { key: "textMuted",     label: "Muted Text" },
      { key: "textDisabled",  label: "Disabled Text" },
    ],
  },
  {
    label: "Status",
    keys: [
      { key: "success", label: "Success" },
      { key: "danger",  label: "Danger / Error" },
      { key: "warning", label: "Warning" },
      { key: "info",    label: "Info" },
    ],
  },
  {
    label: "Other",
    keys: [{ key: "borderColor", label: "Border Color" }],
  },
]

// ─── Color Picker Row ──────────────────────────────────────────────────────────
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-gray-300 flex-1 min-w-0 truncate">{label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs font-mono text-gray-500 w-20 text-right">{value}</span>
        <label className="relative cursor-pointer">
          <div
            className="w-9 h-9 rounded-lg border-2 border-gray-600 shadow-inner cursor-pointer hover:scale-110 transition-transform"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>
    </div>
  )
}

// ─── Mini Preview ──────────────────────────────────────────────────────────────
function MiniPreview({ colors }: { colors: ThemeColors }) {
  return (
    <div
      className="rounded-xl overflow-hidden border shadow-2xl"
      style={{ borderColor: colors.borderColor, height: 340 }}
    >
      <div className="flex h-full">
        {/* Sidebar */}
        <div
          className="w-14 flex flex-col items-center py-3 gap-3 flex-shrink-0"
          style={{ backgroundColor: colors.bgSidebar, borderRight: `1px solid ${colors.borderColor}` }}
        >
          <div className="w-7 h-7 rounded-lg" style={{ backgroundColor: colors.primaryColor }} />
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-1.5 rounded-full"
              style={{
                backgroundColor: i === 0 ? colors.primaryColor : colors.textDisabled,
                opacity: i === 0 ? 1 : 0.5,
              }}
            />
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: colors.bgMain }}>
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-4 py-2 flex-shrink-0"
            style={{ borderBottom: `1px solid ${colors.borderColor}`, backgroundColor: colors.bgSidebar }}
          >
            <div className="w-24 h-2 rounded-full" style={{ backgroundColor: colors.textMuted, opacity: 0.4 }} />
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: colors.primaryColor }} />
          </div>

          <div className="flex-1 p-4 overflow-hidden flex flex-col gap-3">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2">
              {[colors.success, colors.warning, colors.danger].map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg p-2 flex flex-col gap-1"
                  style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.borderColor}` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: colors.textDisabled, opacity: 0.4 }} />
                  <div className="w-2/3 h-2 rounded-full font-bold" style={{ backgroundColor: colors.textPrimary, opacity: 0.7 }} />
                </div>
              ))}
            </div>

            {/* Table card */}
            <div
              className="rounded-lg p-3 flex-1 flex flex-col gap-2"
              style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.borderColor}` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: colors.primaryColor }} />
                <div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: colors.textDisabled, opacity: 0.3 }} />
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.textDisabled, opacity: 0.4 }} />
                  <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: colors.textMuted, opacity: 0.2 }} />
                  <div
                    className="w-8 h-2 rounded-full text-center"
                    style={{
                      backgroundColor: i % 2 === 0 ? colors.success : colors.warning,
                      opacity: 0.7,
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Button */}
            <div className="flex gap-2">
              <div
                className="flex-1 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: colors.primaryColor }}
              >
                <div className="w-12 h-1.5 rounded-full bg-white opacity-80" />
              </div>
              <div
                className="w-16 h-6 rounded-lg"
                style={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.borderColor}` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ThemeSettingsPage() {
  const { themeColors, setTheme } = useTheme()
  const [local, setLocal] = useState<ThemeColors>({ ...themeColors })
  const [saving, setSaving] = useState(false)
  const [savedPreset, setSavedPreset] = useState<string | null>(null)

  const updateColor = useCallback(
    (key: keyof ThemeColors, value: string) => {
      const next = { ...local, [key]: value }
      setLocal(next)
      setTheme(next) // live preview via CSS vars
    },
    [local, setTheme],
  )

  const applyPreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      setSavedPreset(preset.name)
      setLocal(preset.colors)
      setTheme(preset.colors)
    },
    [setTheme],
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem("superadminToken")
      const res = await fetch(`${API_BASE}/api/theme`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(local),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Theme saved successfully")
        setTheme(local)
      } else {
        toast.error(json.message || "Failed to save theme")
      }
    } catch {
      toast.error("Network error — could not save theme")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setLocal({ ...DEFAULT_COLORS })
    setTheme(DEFAULT_COLORS)
    applyThemeVars(DEFAULT_COLORS)
    setSavedPreset(null)
    try {
      const token = localStorage.getItem("superadminToken")
      const res = await fetch(`${API_BASE}/api/theme`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(DEFAULT_COLORS),
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Theme reset to defaults")
      } else {
        toast.error("Reset failed on server")
      }
    } catch {
      toast.error("Network error — reset applied locally only")
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: local.primaryColor + "22" }}
          >
            <Palette className="h-6 w-6" style={{ color: local.primaryColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Theme Settings</h1>
            <p className="text-sm text-gray-400">Customize the CRM color scheme for all users</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
            style={{ borderColor: local.borderColor, color: local.textMuted }}
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: local.primaryColor }}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Theme"}
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-3 font-semibold">Preset Themes</p>
        <div className="flex flex-wrap gap-3">
          {PRESETS.map(preset => {
            const active = savedPreset === preset.name
            return (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all hover:scale-105"
                style={{
                  backgroundColor: active ? preset.colors.primaryColor + "22" : preset.colors.bgCard,
                  borderColor:     active ? preset.colors.primaryColor : preset.colors.borderColor,
                  color:           active ? preset.colors.primaryColor : preset.colors.textMuted,
                }}
              >
                <span>{preset.emoji}</span>
                <span>{preset.name}</span>
                {active && <Check className="h-3.5 w-3.5" />}
                {/* Swatch dots */}
                <span className="flex gap-0.5 ml-1">
                  {[preset.colors.bgSidebar, preset.colors.primaryColor, preset.colors.highlight].map((c, i) => (
                    <span key={i} className="w-2.5 h-2.5 rounded-full inline-block border border-white/10" style={{ backgroundColor: c }} />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Body: pickers + preview */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Color Pickers — 3 cols */}
        <div className="xl:col-span-3 space-y-5">
          {COLOR_GROUPS.map(group => (
            <div
              key={group.label}
              className="rounded-xl border p-5"
              style={{ backgroundColor: local.bgCard, borderColor: local.borderColor }}
            >
              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: local.primaryColor }}>
                {group.label}
              </p>
              <div className="divide-y" style={{ borderColor: local.borderColor + "55" }}>
                {group.keys.map(({ key, label }) => (
                  <ColorRow
                    key={key}
                    label={label}
                    value={local[key]}
                    onChange={v => updateColor(key, v)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Live Preview — 2 cols */}
        <div className="xl:col-span-2">
          <div className="sticky top-6">
            <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-3">Live Preview</p>
            <MiniPreview colors={local} />

            {/* Token reference */}
            <div
              className="rounded-xl border p-4 mt-4"
              style={{ backgroundColor: local.bgCard, borderColor: local.borderColor }}
            >
              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: local.primaryColor }}>
                CSS Variables
              </p>
              <div className="space-y-1 font-mono text-xs" style={{ color: local.textMuted }}>
                {[
                  ["--theme-primary",       local.primaryColor],
                  ["--theme-highlight",     local.highlight],
                  ["--theme-bg-main",       local.bgMain],
                  ["--theme-bg-sidebar",    local.bgSidebar],
                  ["--theme-bg-card",       local.bgCard],
                  ["--theme-text-primary",  local.textPrimary],
                  ["--theme-success",       local.success],
                  ["--theme-danger",        local.danger],
                  ["--theme-border",        local.borderColor],
                ].map(([name, val]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 border border-white/10"
                      style={{ backgroundColor: val }}
                    />
                    <span className="flex-1 truncate opacity-70">{name}</span>
                    <span style={{ color: local.highlight }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
