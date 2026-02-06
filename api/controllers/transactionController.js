const { Transaction, User, Rate } = require('../models');
const { sendSMS } = require('../services/smsService');

const createTransaction = async (req, res) => {
    try {
        const { amount_sent, recipient_details, type } = req.body;
        const userId = req.user.id;
        const user = await User.findByPk(userId);

        const rateRecord = await Rate.findOne({ where: { pair: 'GHS-CAD' } });
        const exchange_rate = rateRecord ? rateRecord.rate : 0.10;

        const amount_received = amount_sent * exchange_rate;

        const transaction = await Transaction.create({
            userId,
            type: type || 'GHS-CAD',
            amount_sent,
            exchange_rate,
            amount_received,
            recipient_details,
            status: 'pending',
            proof_url: ''
        });

        // Send SMS Notification
        if (user && user.phone) {
            const refMsg = recipient_details.admin_reference ? ` Ref: ${recipient_details.admin_reference}.` : '';
            await sendSMS(user.phone, `Your transfer request of ${amount_sent} ${type.split('-')[0]} to ${recipient_details.name} has been initiated.${refMsg} Status: Pending.`);
        }

        res.status(201).json(transaction);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTransactions = async (req, res) => {
    try {
        const where = {};
        if (req.user.role !== 'admin') {
            where.userId = req.user.id;
        }
        const transactions = await Transaction.findAll({ where, include: ['user'] });
        res.json(transactions);
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

        transaction.status = status;
        await transaction.save();

        // Notify user about status change
        if (transaction.user && transaction.user.phone) {
            await sendSMS(transaction.user.phone, `Update: Your transaction to ${transaction.recipient_details.name} is now ${status.toUpperCase()}.`);
        }

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

        transaction.proof_url = `/uploads/${req.file.filename}`;
        await transaction.save();

        // Notify user
        if (transaction.user && transaction.user.phone) {
            await sendSMS(transaction.user.phone, `Proof of payment uploaded for transaction #${transaction.id}. We will verify it shortly.`);
        }

        res.json({ message: 'Proof uploaded successfully', proof_url: transaction.proof_url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createTransaction, getTransactions, updateStatus, uploadProof };
