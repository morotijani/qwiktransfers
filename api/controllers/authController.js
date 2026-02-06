const { User, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendVerificationSuccessEmail, sendResetPasswordEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');

const register = async (req, res) => {
    try {
        const { email, password, full_name, phone, country, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            email,
            password: hashedPassword,
            full_name,
            phone,
            country: country || 'Ghana',
            role: role || 'user',
            kyc_status: 'pending',
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
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateKYC = async (req, res) => {
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

module.exports = {
    register,
    login,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    getProfile,
    getAllUsers,
    updateKYC,
    updateProfile,
    changePassword,
    setPin,
    verifyPin
};
