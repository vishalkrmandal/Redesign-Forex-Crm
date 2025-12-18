// backend/services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config/config');
const { verificationEmailTemplate, passwordResetTemplate } = require('../utils/emailTemplates');

const sendEmail = async (options) => {
    // Create transporter
    const transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: false,
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // Define email options
    const mailOptions = {
        from: `"${config.SITE_NAME}" <${config.EMAIL_FROM}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (user, verificationToken) => {
    const verificationURL = `${config.SERVER_URL}/api/auth/verify-email/${verificationToken}`;

    await sendEmail({
        to: user.email,
        subject: `🔐 Verify Your Email Address - ${config.SITE_NAME}`,
        html: verificationEmailTemplate(user.firstname, verificationURL)
    });
};


// Add new function
const sendPasswordResetEmail = async (user, resetToken) => {
    const resetURL = `${config.CLIENT_URL}/reset-password/${resetToken}`;

    console.log('Sending password reset email to:', user.email);
    await sendEmail({
        to: user.email,
        subject: `🔒 Password Reset - ${config.SITE_NAME}`,
        html: passwordResetTemplate(user.firstname, resetURL)
    });
};

// Update module exports
module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
};

