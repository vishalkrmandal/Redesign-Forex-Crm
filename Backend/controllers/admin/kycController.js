const Profile = require('../../models/client/Profile');
const User = require('../../models/User');

// Get all KYC requests - sorted by latest
exports.getAllKYCRequests = async (req, res) => {
    try {
        // Fetch ALL profiles that have a user (no status filter)
        const profiles = await Profile.find({
            user: { $ne: null } // Only get profiles that have a user
        })
            .populate('user', 'firstname lastname email phone country dateofbirth')
            .populate('kycUpdates.verifiedBy', 'firstname lastname')
            .sort({ kycRequestedAt: -1, updatedAt: -1 });

        // Map to response format with additional safety checks
        const kycRequests = profiles
            .filter(profile => profile.user != null) // Extra safety filter
            .map(profile => ({
                id: profile._id,
                userId: profile.user._id,
                firstname: profile.user.firstname || '',
                lastname: profile.user.lastname || '',
                email: profile.user.email || '',
                phone: profile.user.phone || '',
                country: profile.user.country || { name: '', state: '' },
                dateofbirth: profile.user.dateofbirth || null,
                kycStatus: profile.kycStatus || 'unverified',
                kycRequestedAt: profile.kycRequestedAt || profile.updatedAt || null,
                educationLevel: profile.educationLevel || '',
                isEmployed: profile.isEmployed || false,
                idDocument: profile.idDocument || '',
                address1Document: profile.address1Document || '',
                address2Document: profile.address2Document || '',
                bankDetails: profile.bankDetails || {},
                walletDetails: profile.walletDetails || {},
                pendingUpdates: (profile.kycUpdates || []).filter(update => update.status === 'pending')
            }));

        res.status(200).json({
            success: true,
            count: kycRequests.length,
            data: kycRequests
        });
    } catch (error) {
        console.error('Get KYC requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching KYC requests',
            error: error.message
        });
    }
};

// Verify KYC
exports.verifyKYC = async (req, res) => {
    try {
        const { profileId } = req.params;

        // First, update the main KYC status
        const profile = await Profile.findById(profileId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Update KYC status
        profile.kycStatus = 'verified';
        profile.kycVerified = true;
        profile.kycVerifiedAt = Date.now();
        profile.kycVerifiedBy = req.user.id;
        profile.kycRejectReason = null;

        // Update all pending kycUpdates to verified
        if (profile.kycUpdates && profile.kycUpdates.length > 0) {
            profile.kycUpdates.forEach(update => {
                if (update.status === 'pending') {
                    update.status = 'verified';
                    update.verifiedAt = Date.now();
                    update.verifiedBy = req.user.id;
                }
            });
        }

        await profile.save();

        // Populate user data
        await profile.populate('user', 'firstname lastname email');

        // Send notification to client
        // if (req.notificationTriggers) {
        //     await req.notificationTriggers.handleKYCStatusChange(
        //         profile.toObject(),
        //         'verified'
        //     );
        // }

        res.status(200).json({
            success: true,
            message: 'KYC verified successfully',
            data: profile
        });
    } catch (error) {
        console.error('Verify KYC error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying KYC',
            error: error.message
        });
    }
};

// Reject KYC
exports.rejectKYC = async (req, res) => {
    try {
        const { profileId } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason || rejectionReason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        // Find profile
        const profile = await Profile.findById(profileId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Update KYC status
        profile.kycStatus = 'rejected';
        profile.kycVerified = false;
        profile.kycRejectReason = rejectionReason;
        profile.kycVerifiedBy = req.user.id;
        profile.kycVerifiedAt = Date.now();

        // Update all pending kycUpdates to rejected
        if (profile.kycUpdates && profile.kycUpdates.length > 0) {
            profile.kycUpdates.forEach(update => {
                if (update.status === 'pending') {
                    update.status = 'rejected';
                    update.rejectionReason = rejectionReason;
                    update.verifiedAt = Date.now();
                    update.verifiedBy = req.user.id;
                }
            });
        }

        await profile.save();

        // Populate user data
        await profile.populate('user', 'firstname lastname email');

        // Send notification to client
        // if (req.notificationTriggers) {
        //     await req.notificationTriggers.handleKYCStatusChange(
        //         profile.toObject(),
        //         'rejected',
        //         rejectionReason
        //     );
        // }

        res.status(200).json({
            success: true,
            message: 'KYC rejected successfully',
            data: profile
        });
    } catch (error) {
        console.error('Reject KYC error:', error);
        res.status(500).json({
            success: false,
            message: 'Error rejecting KYC',
            error: error.message
        });
    }
};

// Mark as unverified
exports.markAsUnverified = async (req, res) => {
    try {
        const { profileId } = req.params;

        const profile = await Profile.findById(profileId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        // Update KYC status
        profile.kycStatus = 'unverified';
        profile.kycVerified = false;
        profile.kycRejectReason = null;
        profile.kycVerifiedBy = null;
        profile.kycVerifiedAt = null;
        profile.kycRequestedAt = Date.now();

        await profile.save();

        // Populate user data
        await profile.populate('user', 'firstname lastname email');

        res.status(200).json({
            success: true,
            message: 'KYC marked as unverified',
            data: profile
        });
    } catch (error) {
        console.error('Mark as unverified error:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking KYC as unverified',
            error: error.message
        });
    }
};