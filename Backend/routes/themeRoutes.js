// Backend/routes/themeRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const { getTheme, saveTheme } = require('../controllers/themeController');

// Public — any visitor can fetch the active theme (needed before login)
router.get('/', getTheme);

// Protected — only superadmin can save
router.post('/', protect, authorize('superadmin'), saveTheme);

module.exports = router;
