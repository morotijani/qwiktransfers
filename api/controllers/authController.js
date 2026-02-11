const { User, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendVerificationSuccessEmail, sendResetPasswordEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

const register = async (req, res) => {
    try {
        const { email, password, full_name, phone, country, role, pin } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // Check if user phone number already exists
        const existingUserPhone = await User.findOne({ where: { phone } });
        if (existingUserPhone) {
            return res.status(400).json({ error: 'Phone number is already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedPin = pin ? await bcrypt.hash(pin, 10) : null;
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            email,
            password: hashedPassword,
            transaction_pin: hashedPin,
            full_name,
            phone,
            country: country || 'Ghana',
            role: role || 'user',
            kyc_status: 'unverified',
            balance_ghs: 0.0,
            balance_cad: 0.0,
            verification_token: verificationToken,
            verification_token_expires: new Date(Date.now() + 86400000), // 24 hours
            is_email_verified: false
        });

        // Send Communications
        await sendVerificationEmail(email, verificationToken, full_name);
        if (phone) {
            await sendSMS(phone, `Welcome to Qwiktransfers! Please verify your email ${email} to start sending money.`);
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.status(201).json({ user, token });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'This phone number is already registered' });
        }
        res.status(500).json({ error: error.message });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        // 1. Find user by token
        const user = await User.findOne({ where: { verification_token: token } });

        if (!user) {
            return res.status(404).json({ status: 'invalid', error: 'Invalid verification link' });
        }

        // 2. Check if already verified
        if (user.is_email_verified) {
            return res.status(200).json({ status: 'already_verified', message: 'Account already verified!' });
        }

        // 3. Check expiry
        if (user.verification_token_expires < new Date()) {
            return res.status(400).json({ status: 'expired', error: 'Verification link has expired' });
        }

        // 4. Success - Mark as verified
        user.is_email_verified = true;
        // user.verification_token = null; // Keep token to allow "Already Verified" status on re-click
        await user.save();

        // Send Success Email
        await sendVerificationSuccessEmail(user.email, user.full_name);

        res.json({ status: 'success', message: 'Email verified successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: 'No account found with this email' });
        }

        if (user.is_email_verified) {
            return res.status(400).json({ error: 'This account is already verified' });
        }

        const newToken = crypto.randomBytes(32).toString('hex');
        user.verification_token = newToken;
        user.verification_token_expires = new Date(Date.now() + 86400000); // 24 hours
        await user.save();

        await sendVerificationEmail(email, newToken, user.full_name);

        res.json({ message: 'A new verification link has been sent to your email.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if account is active
        if (user.is_active === false) {
            return res.status(403).json({ error: 'Your account has been disabled. Please contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ user, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.reset_password_token = resetToken;
        user.reset_password_expires = new Date(Date.now() + 3600000); // 1 hour
        await user.save();

        await sendResetPasswordEmail(email, resetToken);
        res.json({ message: 'Reset link sent to your email.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const user = await User.findOne({
            where: {
                reset_password_token: token,
                reset_password_expires: { [Op.gt]: new Date() }
            }
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

        user.password = await bcrypt.hash(newPassword, 10);
        user.reset_password_token = null;
        user.reset_password_expires = null;
        await user.save();

        res.json({ message: 'Password reset successful!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Calculate Limits
        let dailyLimit = 50; // Level 1: Unverified Email
        if (user.is_email_verified) {
            dailyLimit = 500; // Level 2: Verified Email
        }
        if (user.kyc_status === 'verified') {
            dailyLimit = 5000; // Level 3: Verified KYC
        }

        res.json({
            ...user.toJSON(),
            limits: {
                daily: dailyLimit,
                currency: 'USD' // Using USD as a reference base
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', kycStatus = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        const where = {};

        // If role is explicitly provided, filter by it. Otherwise, exclude admins by default.
        if (role) {
            where.role = role;
        } else {
            where.role = { [Op.ne]: 'admin' };
        }

        if (search) {
            where[Op.or] = [
                { full_name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } }
            ];
        }

        if (kycStatus) {
            where.kyc_status = kycStatus;
        }

        const { count, rows: users } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            users,
            total: count,
            pages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateKYCStatus = async (req, res) => {
    try {
        const { userId, status } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.kyc_status = status;
        await user.save();
        res.json({ message: 'KYC status updated', kyc_status: status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const submitKYC = async (req, res) => {
    try {
        const { documentType, documentId } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!req.files || !req.files['front']) {
            return res.status(400).json({ error: 'Front of document is required' });
        }

        user.kyc_document_type = documentType;
        user.kyc_document_id = documentId;
        user.kyc_front_url = `/uploads/${req.files['front'][0].filename}`;

        if (req.files['back']) {
            user.kyc_back_url = `/uploads/${req.files['back'][0].filename}`;
        }

        user.kyc_status = 'pending';
        await user.save();

        res.json({ message: 'KYC documents submitted successfully', kyc_status: 'pending' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.full_name = full_name;
        user.phone = phone;
        await user.save();

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'This phone number is already registered' });
        }
        res.status(500).json({ error: error.message });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Current password incorrect' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const setPin = async (req, res) => {
    try {
        const { pin } = req.body;
        if (!/^\d{4}$/.test(pin)) {
            return res.status(400).json({ error: 'PIN must be 4 digits' });
        }
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.transaction_pin = await bcrypt.hash(pin, 10);
        await user.save();

        res.json({ message: 'Transaction PIN set successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyPin = async (req, res) => {
    try {
        const { pin } = req.body;
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!user.transaction_pin) return res.status(400).json({ error: 'Transaction PIN not set' });

        const isMatch = await bcrypt.compare(pin, user.transaction_pin);
        if (!isMatch) return res.status(401).json({ error: 'Invalid PIN' });

        res.json({ message: 'PIN verified' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.role = role;
        await user.save();

        res.json({ message: 'User role updated successfully', role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createVendor = async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;

        const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { phone }] } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email or phone already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const vendor = await User.create({
            email,
            password: hashedPassword,
            full_name,
            phone,
            role: 'vendor',
            is_active: true,
            is_email_verified: true, // Admin-created vendors are pre-verified
            kyc_status: 'verified' // Admin assumes responsibility for vendor identity
        });

        res.status(201).json({ message: 'Vendor created successfully', vendor });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.is_active = !user.is_active;
        await user.save();

        res.json({ message: `User account ${user.is_active ? 'enabled' : 'disabled'}`, is_active: user.is_active });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    getProfile,
    getAllUsers,
    updateKYCStatus,
    submitKYC,
    updateProfile,
    changePassword,
    setPin,
    verifyPin,
    updateUserRole,
    createVendor,
    toggleUserStatus
};
