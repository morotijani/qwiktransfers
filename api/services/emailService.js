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

// Verify email configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email Configuration Error:', error);
    } else {
        console.log('✅ Email Configuration: Connected successfully');
    }
});

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
                        <h1 style="color: ${PEACH}; margin: 0; font-size: 32px; letter-spacing: 4px;">QWIKTRANSFERS</h1>
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

const sendTransactionInitiatedEmail = async (user, transaction) => {
    const { amount_sent, amount_received, type, recipient_details, exchange_rate, createdAt } = transaction;
    const [fromCurrency, toCurrency] = type.split('-');

    const formattedDate = new Date(createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    await sendEmail(
        user.email,
        `Transfer Initiated: ${amount_sent} ${fromCurrency}`,
        `
            <div style="background-color: #f8f9fa; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0;">
                <h2 style="color: ${DEEP_BROWN}; margin-top: 0;">Transfer Details</h2>
                <p>Hello ${user.full_name}, your transfer request has been received and is currently pending.</p>
                <div style="font-size: 0.8rem; color: #888; margin-bottom: 20px;">Initiated on ${formattedDate}</div>
                
                <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Amount Sent:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold;">${amount_sent} ${fromCurrency}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Exchange Rate:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 0.85rem;">1 ${fromCurrency} = ${Number(exchange_rate).toFixed(4)} ${toCurrency}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Recipient Gets:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; color: ${DEEP_BROWN}; font-size: 1.1rem;">${amount_received} ${toCurrency}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666; border-top: 1px solid #eee;">Recipient:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; border-top: 1px solid #eee;">${recipient_details.name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #666;">Method:</td>
                        <td style="padding: 8px 0; text-align: right; font-weight: bold; text-transform: capitalize;">${recipient_details.type.replace('_', ' ')}</td>
                    </tr>
                    ${recipient_details.admin_reference ? `
                    <tr style="background-color: ${PEACH};">
                        <td style="padding: 12px; color: ${DEEP_BROWN}; font-weight: bold;">Payment Ref:</td>
                        <td style="padding: 12px; text-align: right; font-weight: 800; font-size: 1.2rem; color: ${DEEP_BROWN};">${recipient_details.admin_reference}</td>
                    </tr>
                    ` : ''}
                </table>

                <p style="font-size: 0.9rem; color: #666;">Please ensure you have made the payment to the admin account with the reference code above for faster processing.</p>
                
                <div style="text-align: center; margin-top: 32px;">
                    <a href="${APP_URL}/dashboard" style="background-color: ${DEEP_BROWN}; color: ${PEACH}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Status</a>
                </div>
            </div>
        `
    );
};

const sendTransactionCompletedEmail = async (user, transaction) => {
    const { amount_received, type, recipient_details, sent_at } = transaction;
    const [, toCurrency] = type.split('-');

    const formattedDate = new Date(sent_at || new Date()).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });

    await sendEmail(
        user.email,
        `Transfer Completed: ${amount_received} ${toCurrency} Delivered`,
        `
            <div style="background-color: #f8f9fa; padding: 24px; border-radius: 12px; border: 1px solid #e0e0e0;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="background-color: #d4edda; color: #155724; padding: 12px; border-radius: 50%; display: inline-block; width: 40px; height: 40px; line-height: 40px; font-size: 24px;">✓</div>
                    <h2 style="color: ${DEEP_BROWN}; margin-top: 16px;">Transfer Completed!</h2>
                    <p>Hello ${user.full_name}, your transfer to <b>${recipient_details.name}</b> has been successfully processed and sent.</p>
                </div>
                
                <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eee;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 10px 0; color: #666;">Amount Delivered:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #28a745; font-size: 1.2rem;">${amount_received} ${toCurrency}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666;">Recipient:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${recipient_details.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666;">Payment Method:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold; text-transform: capitalize;">${recipient_details.type.replace('_', ' ')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px 0; color: #666;">Completed On:</td>
                            <td style="padding: 10px 0; text-align: right; font-weight: bold;">${formattedDate}</td>
                        </tr>
                    </table>
                </div>

                <p style="margin-top: 24px; font-size: 0.9rem; color: #666; text-align: center;">Thank you for choosing Qwiktransfers! We look forward to serving you again soon.</p>
                
                <div style="text-align: center; margin-top: 32px;">
                    <a href="${APP_URL}/dashboard" style="background-color: ${DEEP_BROWN}; color: ${PEACH}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Transactions</a>
                </div>
            </div>
        `
    );
};

const verifyConnection = () => {
    return new Promise((resolve) => {
        transporter.verify((error) => {
            if (error) resolve({ status: 'error', message: error.message });
            else resolve({ status: 'active', message: 'Connected successfully' });
        });
    });
};

module.exports = {
    sendVerificationEmail,
    sendVerificationSuccessEmail,
    sendResetPasswordEmail,
    sendEmail,
    sendTransactionInitiatedEmail,
    sendTransactionCompletedEmail,
    verifyConnection
};
