const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, resendVerification, forgotPassword, resetPassword, getProfile, getAllUsers, updateKYCStatus, submitKYC, updateProfile, changePassword, setPin, verifyPin, updateUserRole, createVendor, toggleUserStatus } = require('../controllers/authController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', verifyToken, getProfile);
router.patch('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);
router.post('/set-pin', verifyToken, setPin);
router.post('/verify-pin', verifyToken, verifyPin);
router.get('/users', verifyAdmin, getAllUsers);
router.patch('/kyc/status', verifyAdmin, updateKYCStatus);
router.patch('/update-role', verifyAdmin, updateUserRole);
router.post('/create-vendor', verifyAdmin, createVendor);
router.patch('/toggle-status', verifyAdmin, toggleUserStatus);

router.post('/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        const user = await require('../models').User.findByPk(req.user.id);
        user.profile_picture = `/uploads/${req.file.filename}`;
        await user.save();
        res.json({ message: 'Avatar updated', profile_picture: user.profile_picture });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/kyc', verifyToken, upload.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 }
]), submitKYC);

module.exports = router;
