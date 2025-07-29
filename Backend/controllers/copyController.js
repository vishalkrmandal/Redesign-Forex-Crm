// Backend/controllers/copyController.js
const Copy = require('../models/Copy');
const Account = require('../models/client/Account');
const User = require('../models/User');

// @desc    Create a new copy request with multiple accounts
// @route   POST /api/copy/request
// @access  Private (Client)
exports.createCopyRequest = async (req, res) => {
    try {
        const { accountIds, copyType } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0 || !copyType) {
            return res.status(400).json({
                success: false,
                message: 'At least one account and copy type are required'
            });
        }

        // Verify all accounts belong to user
        const accounts = await Account.find({
            _id: { $in: accountIds },
            user: userId
        });

        if (accounts.length !== accountIds.length) {
            return res.status(404).json({
                success: false,
                message: 'One or more accounts not found or not authorized'
            });
        }

        // Check if there's already a pending request for any of these accounts
        const existingRequest = await Copy.findOne({
            user: userId,
            accounts: { $in: accountIds },
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request for one or more of these accounts'
            });
        }

        // Create copy request with multiple accounts
        const copyRequest = await Copy.create({
            user: userId,
            accounts: accountIds,
            copyType
        });

        // Populate the response
        await copyRequest.populate([
            {
                path: 'user',
                select: 'firstname lastname email'
            },
            {
                path: 'accounts',
                select: 'mt5Account accountType'
            }
        ]);

        res.status(201).json({
            success: true,
            message: 'Copy request created successfully',
            data: copyRequest
        });

    } catch (error) {
        console.error('Create copy request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// @desc    Get user's copy requests history
// @route   GET /api/copy/my-requests
// @access  Private (Client)
exports.getUserCopyRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const copyRequests = await Copy.find({ user: userId })
            .populate({
                path: 'accounts',
                select: 'mt5Account accountType'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Copy.countDocuments({ user: userId });

        res.status(200).json({
            success: true,
            data: copyRequests,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });

    } catch (error) {
        console.error('Get user copy requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// @desc    Get all copy requests (Admin)
// @route   GET /api/copy/admin/requests
// @access  Private (Admin)
exports.getAllCopyRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { status, search } = req.query;

        // Build query
        let query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Search functionality
        let searchQuery = {};
        if (search) {
            const searchRegex = new RegExp(search, 'i');

            // Find users matching the search term
            const matchingUsers = await User.find({
                $or: [
                    { firstname: searchRegex },
                    { lastname: searchRegex },
                    { email: searchRegex }
                ]
            }).select('_id');

            // Find accounts matching the search term
            const matchingAccounts = await Account.find({
                mt5Account: searchRegex
            }).select('_id');

            const userIds = matchingUsers.map(user => user._id);
            const accountIds = matchingAccounts.map(account => account._id);

            searchQuery = {
                $or: [
                    { user: { $in: userIds } },
                    { accounts: { $in: accountIds } }
                ]
            };
        }

        // Combine queries
        const finalQuery = Object.keys(searchQuery).length > 0
            ? { ...query, ...searchQuery }
            : query;

        const copyRequests = await Copy.find(finalQuery)
            .populate({
                path: 'user',
                select: 'firstname lastname email phone country dateofbirth'
            })
            .populate({
                path: 'accounts',
                select: 'mt5Account accountType leverage balance equity'
            })
            .populate({
                path: 'processedBy',
                select: 'firstname lastname email'
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Copy.countDocuments(finalQuery);

        res.status(200).json({
            success: true,
            data: copyRequests,
            pagination: {
                page,
                pages: Math.ceil(total / limit),
                total,
                limit
            }
        });

    } catch (error) {
        console.error('Get all copy requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// @desc    Accept copy request
// @route   PUT /api/copy/admin/accept/:id
// @access  Private (Admin)
exports.acceptCopyRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user._id;

        const copyRequest = await Copy.findById(id);

        if (!copyRequest) {
            return res.status(404).json({
                success: false,
                message: 'Copy request not found'
            });
        }

        if (copyRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending requests can be accepted'
            });
        }

        copyRequest.status = 'accepted';
        copyRequest.processedBy = adminId;
        copyRequest.processedAt = new Date();

        await copyRequest.save();

        // Populate the response
        await copyRequest.populate([
            {
                path: 'user',
                select: 'firstname lastname email'
            },
            {
                path: 'accounts',
                select: 'mt5Account accountType'
            },
            {
                path: 'processedBy',
                select: 'firstname lastname email'
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Copy request accepted successfully',
            data: copyRequest
        });

    } catch (error) {
        console.error('Accept copy request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// @desc    Reject copy request
// @route   PUT /api/copy/admin/reject/:id
// @access  Private (Admin)
exports.rejectCopyRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const adminId = req.user._id;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const copyRequest = await Copy.findById(id);

        if (!copyRequest) {
            return res.status(404).json({
                success: false,
                message: 'Copy request not found'
            });
        }

        if (copyRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending requests can be rejected'
            });
        }

        copyRequest.status = 'rejected';
        copyRequest.reason = reason.trim();
        copyRequest.processedBy = adminId;
        copyRequest.processedAt = new Date();

        await copyRequest.save();

        // Populate the response
        await copyRequest.populate([
            {
                path: 'user',
                select: 'firstname lastname email'
            },
            {
                path: 'accounts',
                select: 'mt5Account accountType'
            },
            {
                path: 'processedBy',
                select: 'firstname lastname email'
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'Copy request rejected successfully',
            data: copyRequest
        });

    } catch (error) {
        console.error('Reject copy request error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// @desc    Get copy request details
// @route   GET /api/copy/admin/request/:id
// @access  Private (Admin)
exports.getCopyRequestDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const copyRequest = await Copy.findById(id)
            .populate({
                path: 'user',
                select: 'firstname lastname email phone country dateofbirth'
            })
            .populate({
                path: 'accounts',
                select: 'mt5Account accountType leverage balance equity'
            })
            .populate({
                path: 'processedBy',
                select: 'firstname lastname email'
            });

        if (!copyRequest) {
            return res.status(404).json({
                success: false,
                message: 'Copy request not found'
            });
        }

        res.status(200).json({
            success: true,
            data: copyRequest
        });

    } catch (error) {
        console.error('Get copy request details error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};