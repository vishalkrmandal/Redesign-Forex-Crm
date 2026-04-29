// backend/routes/authRoutes.js
const express = require('express');
const {
    signup,
    verifyEmail,
    login,
    adminSignup,
    agentSignup,
    forgotPassword,
    resetPassword,
    impersonateClient,
    checkVerificationStatus,
    resendVerificationEmail,
    checkUserRole,
    logout,
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/admin/signup', protect, authorize('superadmin'), adminSignup);
router.post('/agent/signup', protect, authorize('admin', 'superadmin'), agentSignup);
router.get('/verify-email/:token', verifyEmail);
router.post('/check-verification-status', checkVerificationStatus);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/admin/impersonate/:clientId', protect, authorize('admin', 'superadmin'), impersonateClient);

router.post('/login', login); // Updated to handle role-based login
router.post('/check-role', checkUserRole); // New endpoint to check user role
router.post('/logout', protect, logout); // New logout endpoint

module.exports = router;