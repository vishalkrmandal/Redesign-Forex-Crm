// Backend\routes\client\otpRoutes.js

const express = require('express');
const router = express.Router();
const {
    sendWithdrawalOTP,
    verifyWithdrawalOTP,
    resendWithdrawalOTP,
    sendProfileUpdateOTP,
    verifyProfileUpdateOTP
} = require('../../controllers/client/otpController');
const { protect } = require('../../middlewares/auth');

router.post('/withdrawal/send', protect, sendWithdrawalOTP);
router.post('/withdrawal/verify', protect, verifyWithdrawalOTP);
router.post('/withdrawal/resend', protect, resendWithdrawalOTP);

router.post('/profile-update/send', protect, sendProfileUpdateOTP);
router.post('/profile-update/verify', protect, verifyProfileUpdateOTP);

module.exports = router;