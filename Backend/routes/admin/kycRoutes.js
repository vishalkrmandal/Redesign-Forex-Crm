const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middlewares/auth');
const {
    getAllKYCRequests,
    verifyKYC,
    rejectKYC,
    markAsUnverified
} = require('../../controllers/admin/kycController');

router.use(protect);
router.use(authorize('admin', 'superadmin'));

router.get('/', getAllKYCRequests);
router.put('/:profileId/verify', verifyKYC);
router.put('/:profileId/reject', rejectKYC);
router.put('/:profileId/unverify', markAsUnverified);

module.exports = router;