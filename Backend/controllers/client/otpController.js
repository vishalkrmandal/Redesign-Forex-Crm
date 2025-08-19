// Backend\controllers\client\otpController.js

const crypto = require('crypto');
const User = require('../../models/User');
const Account = require('../../models/client/Account');
const emailService = require('../../services/notificationEmailService');

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Generate OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Send withdrawal OTP
exports.sendWithdrawalOTP = async (req, res, next) => {
    try {
        const { accountId, amount, paymentMethod, bankDetails, eWalletDetails } = req.body;

        // Get account details
        const account = await Account.findOne({
            _id: accountId,
            user: req.user.id
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpKey = `withdrawal_${req.user.id}_${Date.now()}`;

        // Store OTP with expiry (5 minutes)
        otpStore.set(otpKey, {
            otp,
            userId: req.user.id,
            withdrawalData: { accountId, amount, paymentMethod, bankDetails, eWalletDetails },
            expiresAt: Date.now() + 5 * 60 * 1000,
            attempts: 0
        });

        // Get user details
        const user = await User.findById(req.user.id);

        // Send OTP email
        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Withdrawal OTP Verification</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 650px; margin: 0 auto; padding: 5px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Withdrawal OTP Verification</h1>
                        <p>Secure your withdrawal transaction</p>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.firstname}!</h2>
                        <p>You have requested a withdrawal from your trading account. Please use the OTP below to verify this transaction:</p>
                        
                        <div class="otp-box">
                            <div class="otp-code">${otp}</div>
                            <p style="margin: 10px 0 0 0; color: #666;">This OTP will expire in 5 minutes</p>
                        </div>

                        <div class="details">
                            <h3>📋 Transaction Details</h3>
                            <p><strong>Account:</strong> ${account.mt5Account}</p>
                            <p><strong>Amount:</strong> $${amount}</p>
                            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
                            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                        </div>

                        <div class="warning">
                            <h4 style="color: #856404; margin: 0 0 10px 0;">🚨 Security Notice</h4>
                            <p style="margin: 0; color: #856404;">If you did not request this withdrawal, please contact our support team immediately and do not share this OTP with anyone.</p>
                        </div>

                        <div class="footer">
                            <p>This is an automated notification from Zforexlive CRM.</p>
                            <p>If you have any questions, please contact our support team.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        await emailService.sendEmail({
            to: user.email,
            subject: 'Withdrawal OTP Verification - ZforexLive',
            html: emailTemplate
        });

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email address',
            otpKey,
            expiresIn: 300 // 5 minutes in seconds
        });

    } catch (error) {
        console.error('Error sending withdrawal OTP:', error);
        next(error);
    }
};

// Verify withdrawal OTP
exports.verifyWithdrawalOTP = async (req, res, next) => {
    try {
        const { otpKey, otp } = req.body;

        if (!otpStore.has(otpKey)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP session'
            });
        }

        const otpData = otpStore.get(otpKey);

        // Check expiry
        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(otpKey);
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Check attempts
        if (otpData.attempts >= 3) {
            otpStore.delete(otpKey);
            return res.status(400).json({
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.'
            });
        }

        // Verify OTP
        if (otpData.otp !== otp) {
            otpData.attempts++;
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
                remainingAttempts: 3 - otpData.attempts
            });
        }

        // OTP verified successfully
        otpStore.delete(otpKey);

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            withdrawalData: otpData.withdrawalData
        });

    } catch (error) {
        console.error('Error verifying withdrawal OTP:', error);
        next(error);
    }
};

// Resend withdrawal OTP
exports.resendWithdrawalOTP = async (req, res, next) => {
    try {
        const { otpKey } = req.body;

        if (!otpStore.has(otpKey)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP session'
            });
        }

        const otpData = otpStore.get(otpKey);

        // Generate new OTP
        const newOtp = generateOTP();
        otpData.otp = newOtp;
        otpData.expiresAt = Date.now() + 5 * 60 * 1000;
        otpData.attempts = 0;

        // Get user and account details
        const user = await User.findById(req.user.id);
        const account = await Account.findById(otpData.withdrawalData.accountId);

        // Send new OTP email (same template as above)
        const emailTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Withdrawal OTP Verification</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                    .otp-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Withdrawal OTP Verification (Resent)</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.firstname}!</h2>
                        <p>Here's your new OTP for withdrawal verification:</p>
                        
                        <div class="otp-box">
                            <div class="otp-code">${newOtp}</div>
                            <p style="margin: 10px 0 0 0; color: #666;">This OTP will expire in 5 minutes</p>
                        </div>

                        <div class="details">
                            <h3>📋 Transaction Details</h3>
                            <p><strong>Account:</strong> ${account.mt5Account}</p>
                            <p><strong>Amount:</strong> $${otpData.withdrawalData.amount}</p>
                            <p><strong>Payment Method:</strong> ${otpData.withdrawalData.paymentMethod}</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        await emailService.sendEmail({
            to: user.email,
            subject: 'Withdrawal OTP Verification (Resent) - ZforexLive',
            html: emailTemplate
        });

        res.status(200).json({
            success: true,
            message: 'New OTP sent to your email address',
            expiresIn: 300
        });

    } catch (error) {
        console.error('Error resending withdrawal OTP:', error);
        next(error);
    }
};