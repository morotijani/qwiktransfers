const { Transaction, User, Rate, SystemConfig, sequelize } = require('../models');
const { Op } = require('sequelize');
const { sendSMS } = require('../services/smsService');
const { sendTransactionInitiatedEmail, sendTransactionCompletedEmail } = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const { logAction } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

const createTransaction = async (req, res) => {
    try {
        const { amount_sent, recipient_details, type } = req.body;
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        // Daily Limit Enforcement (Dynamic from SystemConfig)
        const configRecord = await SystemConfig.findOne({ where: { key: 'tiered_limits' } });
        const limits = configRecord ? configRecord.value : { level1: 50, level2: 500, level3: 5000 };

        let dailyLimit = limits.level1;
        if (user.is_email_verified) dailyLimit = limits.level2;
        if (user.kyc_status === 'verified') dailyLimit = limits.level3;

        // Calculate sum of today's transactions
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayTransactions = await Transaction.findAll({
            where: {
                userId,
                createdAt: { [require('sequelize').Op.gte]: startOfDay }
            }
        });

        const rateRecord = await Rate.findOne({ where: { pair: 'GHS-CAD' } });
        const liveRate = rateRecord ? parseFloat(rateRecord.rate) : 0.10;

        const getReferenceAmount = (amount, txType, rate) => {
            const currency = txType.split('-')[0];
            const numAmount = parseFloat(amount) || 0;
            // If the transaction is GHS, we convert it to CAD (reference) using the live rate
            // If it's already CAD, we keep it as is.
            return currency === 'GHS' ? numAmount * rate : numAmount;
        };

        const currentSpent = todayTransactions.reduce((sum, tx) => sum + getReferenceAmount(tx.amount_sent, tx.type, liveRate), 0);
        const prospectiveSent = getReferenceAmount(amount_sent, type || 'GHS-CAD', liveRate);

        if (currentSpent + prospectiveSent > dailyLimit) {
            let reason = `Verify your email to increase your limit to $${limits.level2}.`;
            if (user.is_email_verified && user.kyc_status !== 'verified') {
                reason = `Complete KYC verification to increase your limit to $${limits.level3}.`;
            } else if (user.is_email_verified && user.kyc_status === 'verified') {
                reason = `You have reached your maximum daily limit of $${limits.level3}.`;
            }

            return res.status(403).json({
                error: `Daily limit exceeded. You have already spent $${currentSpent.toFixed(2)}. Your current limit is $${dailyLimit}. ${reason}`
            });
        }

        const exchange_rate = type === 'CAD-GHS' ? (1 / liveRate).toFixed(6) : liveRate.toFixed(6);
        const amount_received = (amount_sent * exchange_rate).toFixed(2);

        const rate_locked_until = new Date(Date.now() + 15 * 60000); // 15 minutes

        // Generate Custom Transaction ID: QT-YYYYMMDD-XXXX
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const transaction_id = `QT-${datePart}-${randomPart}`;

        const transaction = await Transaction.create({
            userId,
            type: type || 'GHS-CAD',
            amount_sent,
            exchange_rate: parseFloat(exchange_rate),
            amount_received: parseFloat(amount_received),
            recipient_details,
            status: 'pending',
            proof_url: '',
            rate_locked_until,
            locked_rate: parseFloat(exchange_rate),
            transaction_id
        });

        // Audit log
        await logAction({
            userId,
            action: 'TRANSACTION_CREATE',
            details: `User created transaction ${transaction.id} for ${amount_sent} ${type.split('-')[0]}`,
            ipAddress: req.ip
        });

        // Send Email Notification
        if (user) {
            await sendTransactionInitiatedEmail(user, transaction);
        }

        // Send SMS Notification (Short & Concise)
        if (user && user.phone) {
            const fromCurr = type.split('-')[0];
            const toCurr = type.split('-')[1];
            const refMsg = recipient_details.admin_reference ? `Ref: ${recipient_details.admin_reference}` : '';
            await sendSMS(user.phone, `QWIK: Transfer of ${amount_sent} ${fromCurr} to ${recipient_details.name} (${amount_received} ${toCurr}) initiated. ${refMsg}.`);
        }

        // Create Notification for User
        await createNotification({
            userId,
            type: 'TRANSACTION_UPDATE',
            message: `Transaction of ${amount_sent} ${type.split('-')[0]} initiated. Your rate is locked for 15 minutes.`
        });

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        const { status, userId, vendorId } = req.query;

        if (req.user.role !== 'admin') {
            where.userId = req.user.id;
        } else {
            // Admin can filter by specific user or vendor
            if (userId) where.userId = userId;
            if (vendorId) where.vendorId = vendorId;
        }

        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            const sequelize = Transaction.sequelize;
            where[Op.or] = [
                sequelize.where(sequelize.cast(sequelize.col('Transaction.id'), 'TEXT'), { [Op.like]: `%${search}%` }),
                sequelize.where(sequelize.cast(sequelize.col('amount_sent'), 'TEXT'), { [Op.like]: `%${search}%` }),
                { '$user.full_name$': { [Op.like]: `%${search}%` } },
                { recipient_details: { [Op.contains]: { name: search } } }
            ];
        }

        const { count, rows: transactions } = await Transaction.findAndCountAll({
            where,
            include: [{ model: User, as: 'user' }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset),
            distinct: true
        });

        res.json({
            transactions,
            total: count,
            pages: Math.ceil(count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const where = {};

        // Allow lookup by ID (PK) or transaction_id (custom String)
        if (id && isNaN(id)) {
            where.transaction_id = id;
        } else if (id) {
            where[Op.or] = [{ id: id }, { transaction_id: id }];
        }

        if (req.user.role !== 'admin') {
            where.userId = req.user.id;
        }

        const transaction = await Transaction.findOne({ where, include: [{ model: User, as: 'user' }] });
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const transaction = await Transaction.findByPk(id, { include: ['user'] });

        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        const result = await sequelize.transaction(async (t) => {
            transaction.status = status;
            if (status === 'sent') {
                transaction.sent_at = new Date();
                // Async email notification - outside transaction usually, but here fine
                sendTransactionCompletedEmail(transaction.user, transaction).catch(err => console.error("Completion email failed:", err));
            }
            return await transaction.save({ transaction: t });
        });

        // Notify user about status change via SMS
        if (transaction.user && transaction.user.phone) {
            const toCurr = transaction.type?.split('-')[1] || 'CAD';
            await sendSMS(transaction.user.phone, `Success! Your transfer of ${transaction.amount_received} ${toCurr} to ${transaction.recipient_details.name} is COMPLETED.`);
        }

        // Update Audit Log
        await logAction({
            userId: req.user.id,
            action: 'TRANSACTION_STATUS_CHANGE',
            details: `Admin changed status of transaction ${transaction.id} to ${status}`,
            ipAddress: req.ip
        });

        // Create Notification for User
        await createNotification({
            userId: transaction.userId,
            type: 'TRANSACTION_UPDATE',
            message: `Your transaction #${transaction.id} status has been updated to ${status.toUpperCase()}.`
        });

        res.json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const uploadProof = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findByPk(id, { include: ['user'] });
        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        // Check Rate Lock
        if (transaction.rate_locked_until && new Date() > new Date(transaction.rate_locked_until)) {
            return res.status(400).json({
                error: 'Rate lock expired. Please create a new transaction with the current market rate.',
                expired: true
            });
        }

        // Delete old proof if it exists
        if (transaction.proof_url) {
            const oldPath = path.join(__dirname, '..', transaction.proof_url);
            fs.access(oldPath, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(oldPath, (unlinkErr) => {
                        if (unlinkErr) console.error("Error deleting old proof:", unlinkErr);
                    });
                }
            });
        }

        transaction.proof_url = `/uploads/${req.file.filename}`;
        transaction.proof_uploaded_at = new Date();
        await transaction.save();

        // Notify user
        if (transaction.user && transaction.user.phone) {
            await sendSMS(transaction.user.phone, `Proof of payment uploaded for transaction #${transaction.id}. We will verify it shortly.`);
        }

        // Audit log
        await logAction({
            userId: transaction.userId,
            action: 'TRANSACTION_PROOF_UPLOAD',
            details: `User uploaded proof for transaction ${transaction.id}`,
            ipAddress: req.ip
        });

        // Create Notification for User
        await createNotification({
            userId: transaction.userId,
            type: 'TRANSACTION_UPDATE',
            message: `Proof of payment for transaction #${transaction.id} has been uploaded and is pending verification.`
        });

        res.json({ message: 'Proof uploaded successfully', proof_url: transaction.proof_url, proof_uploaded_at: transaction.proof_uploaded_at });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const cancelTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findByPk(id);

        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        if (transaction.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (transaction.status !== 'pending') {
            return res.status(400).json({ error: `Cannot cancel a transaction that is already ${transaction.status}` });
        }

        if (transaction.proof_url) {
            return res.status(400).json({ error: 'Cannot cancel transaction after proof has been uploaded' });
        }

        transaction.status = 'cancelled';
        await transaction.save();

        // Audit log
        await logAction({
            userId: req.user.id,
            action: 'TRANSACTION_CANCEL',
            details: `Transaction ${transaction.id} cancelled by ${req.user.role}`,
            ipAddress: req.ip
        });

        // Notification
        if (req.user.role === 'admin') {
            await createNotification({
                userId: transaction.userId,
                type: 'TRANSACTION_UPDATE',
                message: `Your transaction #${transaction.id} was cancelled by an administrator.`
            });
        }

        res.json({ message: 'Transaction cancelled successfully', transaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const exportTransactions = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const where = {};

        if (req.user.role !== 'admin') {
            where.userId = req.user.id;
        }

        if (startDate && endDate) {
            const { Op } = require('sequelize');
            where.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const transactions = await Transaction.findAll({
            where,
            include: ['user'],
            order: [['createdAt', 'DESC']]
        });

        // Simple CSV generation
        let csv = 'ID,Date,User,Type,Amount Sent,Exchange Rate,Amount Received,Recipient,Status,Proof Uploaded At\n';
        transactions.forEach(tx => {
            const recipientName = tx.recipient_details?.name || 'N/A';
            const userName = tx.user?.full_name || tx.user?.email || 'N/A';
            csv += `${tx.id},${tx.createdAt},"${userName}",${tx.type},${tx.amount_sent},${tx.exchange_rate},${tx.amount_received},"${recipientName}",${tx.status},${tx.proof_uploaded_at || ''}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=transactions-${new Date().getTime()}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAdminStats = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        // Pending Transactions
        const pendingTransactions = await Transaction.count({ where: { status: 'pending' } });

        // Pending KYC
        const pendingKYC = await User.count({ where: { kyc_status: 'pending' } });

        // Success Volume (Total Sent to recipients)
        const successVolume = await Transaction.sum('amount_received', { where: { status: 'sent' } });

        res.json({
            pendingTransactions,
            pendingKYC,
            successVolume: successVolume || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createTransaction, getTransactions, getTransactionById, updateStatus, uploadProof, cancelTransaction, exportTransactions, getAdminStats };
