const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.MAIL_PORT) || 2525,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('WARNING: MAIL_USER or MAIL_PASS is not defined in .env');
}

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const PEACH = '#f2bc94';
const DEEP_BROWN = '#4a1d17';

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"Qwiktransfers" <${process.env.MAIL_USER}>`,
            to,
            subject,
            html: `
                <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                    <div style="background-color: ${DEEP_BROWN}; padding: 40px; text-align: center;">
                        <h1 style="color: ${PEACH}; margin: 0; font-size: 32px; letter-spacing: 4px;">QWIK</h1>
                        <p style="color: white; opacity: 0.8; margin-top: 10px;">Fast. Secure. Simple.</p>
                    </div>
                    <div style="padding: 40px; background-color: #fff; color: ${DEEP_BROWN}; line-height: 1.6;">
                        ${html}
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; color: #888; font-size: 12px;">
                        &copy; 2026 Qwiktransfers Inc. All rights reserved.
                    </div>
                </div>
            `
        });
    } catch (error) {
        console.error('Email sending failed:', error);
    }
};

const sendVerificationEmail = async (email, token, name) => {
    const url = `${APP_URL}/verify-email?token=${token}&email=${email}`;
    await sendEmail(
        email,
        'Verify your account',
        `
            <h2>Welcome, ${name || 'User'}!</h2>
            <p>Welcome to Qwiktransfers! Please verify your email address to activate your account and start sending money securely.</p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="${url}" style="background-color: ${DEEP_BROWN}; color: ${PEACH}; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, copy and paste this link: <br> <a href="${url}">${url}</a></p>
            <p><strong>Note:</strong> This link will expire in 24 hours.</p>
        `
    );
};

const sendVerificationSuccessEmail = async (email, name) => {
    await sendEmail(
        email,
        'Account Verified Successfully!',
        `
            <h2>Congratulations, ${name || 'User'}!</h2>
            <p>Your email address has been successfully verified. Your Qwiktransfers account is now fully active.</p>
            <p>You can now start sending money securely across borders with the best rates.</p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="${APP_URL}/login" style="background-color: ${DEEP_BROWN}; color: ${PEACH}; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Login to Dashboard</a>
            </div>
            <p>Thank you for choosing Qwiktransfers!</p>
        `
    );
};

const sendResetPasswordEmail = async (email, token) => {
    const url = `${APP_URL}/reset-password?token=${token}`;
    await sendEmail(
        email,
        'Reset your password',
        `
            <h2>Password Reset Request</h2>
            <p>You requested to reset your password. Click the button below to choose a new one. This link will expire in 1 hour.</p>
            <div style="text-align: center; margin: 40px 0;">
                <a href="${url}" style="background-color: ${DEEP_BROWN}; color: ${PEACH}; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>If you didn't request this, please ignore this email.</p>
        `
    );
};

module.exports = { sendVerificationEmail, sendVerificationSuccessEmail, sendResetPasswordEmail, sendEmail };
