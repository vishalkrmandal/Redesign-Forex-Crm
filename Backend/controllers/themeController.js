// Backend/controllers/themeController.js
const ThemeSettings = require('../models/ThemeSettings');

const THEME_FIELDS = [
  'primaryColor', 'primaryHover', 'highlight',
  'bgMain', 'bgSidebar', 'bgCard',
  'textPrimary', 'textMuted', 'textDisabled',
  'success', 'danger', 'warning', 'info', 'borderColor',
];

const DEFAULT_THEME = {
  primaryColor: '#3B82F6',
  primaryHover: '#2563EB',
  highlight:    '#F59E0B',
  bgMain:       '#0F1117',
  bgSidebar:    '#111315',
  bgCard:       '#1A1D23',
  textPrimary:  '#FFFFFF',
  textMuted:    '#9CA3AF',
  textDisabled: '#6B7280',
  success:      '#10B981',
  danger:       '#EF4444',
  warning:      '#F59E0B',
  info:         '#3B82F6',
  borderColor:  '#374151',
};

// GET /api/theme — public, returns current active theme
exports.getTheme = async (_req, res) => {
  try {
    const theme = await ThemeSettings.findOne().sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      data: theme || DEFAULT_THEME,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/theme — superadmin only, upserts the single theme document
exports.saveTheme = async (req, res) => {
  try {
    const update = {};
    THEME_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });
    update.updatedBy = req.user._id;

    const theme = await ThemeSettings.findOneAndUpdate(
      {},
      { $set: update },
      { upsert: true, new: true },
    );

    res.status(200).json({
      success: true,
      message: 'Theme saved successfully',
      data: theme,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
