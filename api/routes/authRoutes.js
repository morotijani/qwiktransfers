const express = require('express');
const router = express.Router();
const { register, login, verifyEmail, resendVerification, forgotPassword, resetPassword, getProfile, getAllUsers, updateKYC, updateProfile, changePassword, setPin, verifyPin } = require('../controllers/authController');
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
router.patch('/kyc/status', verifyAdmin, updateKYC);

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
router.post('/kyc', verifyToken, upload.single('document'), async (req, res) => {
    try {
        const user = await require('../models').User.findByPk(req.user.id);
        user.kyc_document = `/uploads/${req.file.filename}`;
        user.kyc_status = 'pending';
        await user.save();
        res.json({ message: 'KYC document uploaded', kyc_status: 'pending' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
