// Backend/models/ThemeSettings.js
const mongoose = require('mongoose');

const ThemeSettingsSchema = new mongoose.Schema({
  primaryColor:  { type: String, default: '#3B82F6' },
  primaryHover:  { type: String, default: '#2563EB' },
  highlight:     { type: String, default: '#F59E0B' },
  bgMain:        { type: String, default: '#0F1117' },
  bgSidebar:     { type: String, default: '#111315' },
  bgCard:        { type: String, default: '#1A1D23' },
  textPrimary:   { type: String, default: '#FFFFFF' },
  textMuted:     { type: String, default: '#9CA3AF' },
  textDisabled:  { type: String, default: '#6B7280' },
  success:       { type: String, default: '#10B981' },
  danger:        { type: String, default: '#EF4444' },
  warning:       { type: String, default: '#F59E0B' },
  info:          { type: String, default: '#3B82F6' },
  borderColor:   { type: String, default: '#374151' },
  updatedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ThemeSettings', ThemeSettingsSchema);
