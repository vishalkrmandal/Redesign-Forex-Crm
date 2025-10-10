// backend/controllers/authController.js - Complete updated version
const crypto = require('crypto');
const User = require('../models/User');
const IBClientConfiguration = require('../models/client/IBClientConfiguration');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRE
    });
};

// @desc    Register a new admin user (superadmin only)
// @route   POST /api/auth/admin/signup
// @access  Private (superadmin)
exports.adminSignup = async (req, res, next) => {
    try {
        const { firstname, lastname, email, password, country, phone, dateofbirth } = req.body;

        // Ensure role is set to admin
        const role = 'admin';

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new admin user
        const user = new User({
            firstname,
            lastname,
            email,
            password,
            country: {
                name: country[0],
                state: country[1] || ''
            },
            phone,
            dateofbirth: new Date(dateofbirth),
            role
        });

        // Generate verification token
        const verificationToken = user.generateEmailVerificationToken();

        // Send verification email
        await sendVerificationEmail(user, verificationToken);
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Admin registration successful! Please check your email to verify your account.'
        });
    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during admin registration.'
        });
    }
};

// @desc    Register a new agent user (admin, superadmin)
// @route   POST /api/auth/agent/signup
// @access  Private (admin, superadmin)
exports.agentSignup = async (req, res, next) => {
    try {
        const { firstname, lastname, email, password, country, phone, dateofbirth } = req.body;

        // Ensure role is set to agent
        const role = 'agent';

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new agent user
        const user = await User.create({
            firstname,
            lastname,
            email,
            password,
            country: {
                name: country[0],
                state: country[1] || ''
            },
            phone,
            dateofbirth: new Date(dateofbirth),
            role
        });

        // Generate verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Send verification email
        await sendVerificationEmail(user, verificationToken);

        res.status(201).json({
            success: true,
            message: 'Agent registration successful! Please check your email to verify your account.'
        });
    } catch (error) {
        console.error('Agent signup error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during agent registration.'
        });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
    try {
        const { firstname, lastname, email, password, country, phone, dateofbirth, referralCode } = req.body;

        console.log('Signup request:', { ...req.body, password: '[HIDDEN]' });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Validate referral code if provided
        let validReferral = null;
        let referringIBConfig = null;

        if (referralCode) {
            const ibConfiguration = await IBClientConfiguration.findOne({
                referralCode,
                status: 'active'
            });

            if (!ibConfiguration) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or inactive referral code'
                });
            }

            validReferral = referralCode;
            referringIBConfig = ibConfiguration;
        }

        // Create new user (with default role as 'client')
        const user = new User({
            firstname,
            lastname,
            email,
            password,
            country: {
                name: country[0],
                state: country[1] || ''
            },
            phone,
            dateofbirth: new Date(dateofbirth),
            role: 'client',
            referredBy: validReferral
        });

        // Generate verification token
        const verificationToken = user.generateEmailVerificationToken();

        // Send verification email
        await sendVerificationEmail(user, verificationToken);
        await user.save();

        console.log("Referral Information:", validReferral, referringIBConfig);

        // Auto-create IB configuration if user signed up through referral
        if (validReferral && referringIBConfig) {
            try {
                // Create IB configuration with pending status (no referral code yet)
                await IBClientConfiguration.create({
                    userId: user._id,
                    referralCode: null, // No referral code until user creates it manually
                    parent: referringIBConfig._id,
                    level: referringIBConfig.level + 1,
                    status: 'pending', // Pending until user creates their referral code
                    referredBy: validReferral
                });

                console.log(`Auto-created IB configuration for user ${user._id} with referral ${validReferral}`);
            } catch (ibError) {
                console.error('Error creating IB configuration:', ibError);
                // Don't fail signup if IB creation fails, just log it
            }
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            data: {
                hasReferral: !!validReferral,
                referralCode: validReferral
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during registration.'
        });
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
    try {
        // Get hashed token
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // Find user with matching token and not expired
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Activate account
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        // Redirect to login page with success message
        res.redirect(`${config.CLIENT_URL}/?verified=true`);
    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during email verification.'
        });
    }
};

// @desc    Login user with role-based validation
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password, loginType } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in'
            });
        }

        // Check if password matches
        const isMatch = await user.isPasswordCorrect(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Role-based login validation
        // NEW: Strict validation for ALL login types including client
        if (loginType) {
            if (user.role !== loginType) {
                const suggestedPath = user.role === 'client' ? '/login' : `/login/${user.role}`;
                return res.status(403).json({
                    success: false,
                    message: `Access denied. This login interface is for ${loginType}s only. Your account role is ${user.role}.`,
                    userRole: user.role,
                    expectedRole: loginType,
                    suggestedLoginPath: suggestedPath
                });
            }
        } else {
            // If no loginType provided, default to client validation
            if (user.role !== 'client') {
                const suggestedPath = `/login/${user.role}`;
                return res.status(403).json({
                    success: false,
                    message: `This is the client login interface. Your account role is ${user.role}. Please use the correct login interface.`,
                    userRole: user.role,
                    expectedRole: 'client',
                    suggestedLoginPath: suggestedPath
                });
            }
        }

        // Create token
        const token = generateToken(user._id);

        // Log successful login attempt (optional, for security monitoring)
        console.log(`Successful login - User: ${user.email}, Role: ${user.role}, LoginType: ${loginType || 'client'}, IP: ${req.ip}`);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login.'
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        // Generate reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // Create reset URL
        const resetUrl = `${config.CLIENT_URL}/reset-password/${resetToken}`;

        try {
            // Send email with reset link
            await sendPasswordResetEmail(user, resetToken);

            res.status(200).json({
                success: true,
                message: 'Password reset email sent'
            });
        } catch (error) {
            // If email fails, remove reset token from user
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            return res.status(500).json({
                success: false,
                message: 'Email could not be sent'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again later.'
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        // Get hashed token
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.body.token)
            .digest('hex');

        // Find user with matching token and not expired
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Set new password
        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during password reset'
        });
    }
};

// @desc    Generate token for client impersonation by admin
// @route   POST /api/auth/admin/impersonate/:clientId
// @access  Private (admin and superadmin only)
exports.impersonateClient = async (req, res, next) => {
    try {
        const { clientId } = req.params;

        // Find the client user to impersonate
        const clientUser = await User.findById(clientId);

        if (!clientUser) {
            return res.status(404).json({
                success: false,
                message: 'Client not found'
            });
        }

        // Ensure the user being impersonated is a client or agent
        if (clientUser.role !== 'client' && clientUser.role !== 'agent') {
            return res.status(400).json({
                success: false,
                message: 'You can only impersonate client or agent accounts'
            });
        }

        // Generate token for the client
        const clientToken = generateToken(clientUser._id);

        // Create an impersonation record (optional, for auditing)
        const adminId = req.user.id;
        // You might want to add a model/collection to log this activity
        // await ImpersonationLog.create({ adminId, clientId, timestamp: Date.now() });

        res.status(200).json({
            success: true,
            clientToken,
            user: {
                id: clientUser._id,
                firstname: clientUser.firstname,
                lastname: clientUser.lastname,
                email: clientUser.email,
                role: clientUser.role,
                isEmailVerified: clientUser.isEmailVerified
            }
        });
    } catch (error) {
        console.error('Client impersonation error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during client impersonation.'
        });
    }
};

// @desc    Check email verification status
// @route   POST /api/auth/check-verification-status
// @access  Public
exports.checkVerificationStatus = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            isVerified: user.isEmailVerified
        });
    } catch (error) {
        console.error('Check verification status error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while checking verification status.'
        });
    }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerificationEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new verification token
        const verificationToken = user.generateEmailVerificationToken();
        await user.save();

        // Send verification email
        await sendVerificationEmail(user, verificationToken);

        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });
    } catch (error) {
        console.error('Resend verification email error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while sending verification email.'
        });
    }
};

// @desc    Get user role and suggested login path
// @route   POST /api/auth/check-role
// @access  Public
exports.checkUserRole = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Determine the correct login page
        let loginPath = '/login'; // default for client
        if (user.role === 'admin') {
            loginPath = '/login/admin';
        } else if (user.role === 'superadmin') {
            loginPath = '/login/superadmin';
        } else if (user.role === 'agent') {
            loginPath = '/login/agent';
        }

        res.status(200).json({
            success: true,
            role: user.role,
            loginPath: loginPath,
            isVerified: user.isEmailVerified
        });
    } catch (error) {
        console.error('Check user role error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while checking user role.'
        });
    }
};

// @desc    Logout user (clear specific role token)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
    try {
        const { role } = req.body;
        const userId = req.user.id;

        // Log logout activity
        console.log(`User logout - ID: ${userId}, Role: ${role}, IP: ${req.ip}`);

        // Optional: Add token to blacklist if you're implementing token blacklisting
        // const token = req.headers.authorization.split(' ')[1];
        // await TokenBlacklist.create({ 
        //     token: token, 
        //     userId: userId,
        //     role: role,
        //     blacklistedAt: new Date()
        // });

        res.status(200).json({
            success: true,
            message: 'Logged out successfully',
            role: role
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during logout.'
        });
    }
};