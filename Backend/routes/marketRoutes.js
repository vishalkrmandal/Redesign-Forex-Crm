// Backend/routes/marketRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getMarketData, getDefaultSymbols } = require('../controllers/marketController');

// GET /api/market/chart?symbol=EURUSD&interval=1h
router.get('/chart', protect, getMarketData);

// GET /api/market/symbols
router.get('/symbols', protect, getDefaultSymbols);

module.exports = router;
