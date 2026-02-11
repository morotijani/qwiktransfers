const { Transaction, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const toggleStatus = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.is_online = !user.is_online;
        await user.save();

        res.json({ is_online: user.is_online });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAvailablePool = async (req, res) => {
    try {
        const pool = await Transaction.findAll({
            where: {
                status: 'pending',
                vendorId: null
            },
            include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }],
            order: [['createdAt', 'ASC']]
        });
        res.json(pool);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHandledTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: {
                vendorId: req.user.id
            },
            include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }],
            order: [['updatedAt', 'DESC']]
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const acceptTransaction = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { transactionId } = req.body;

        // Atomic check: Must be pending and have no vendor assigned
        const transaction = await Transaction.findOne({
            where: {
                id: transactionId,
                status: 'pending',
                vendorId: null
            },
            lock: t.LOCK.UPDATE,
            transaction: t
        });

        if (!transaction) {
            await t.rollback();
            return res.status(400).json({ error: 'Transaction already accepted or unavailable' });
        }

        transaction.vendorId = req.user.id;
        transaction.status = 'processing';
        await transaction.save({ transaction: t });

        await t.commit();
        res.json({ message: 'Transaction accepted successfully', transaction });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ error: error.message });
    }
};

const completeTransaction = async (req, res) => {
    try {
        const { transactionId } = req.body;
        const transaction = await Transaction.findOne({
            where: {
                id: transactionId,
                vendorId: req.user.id,
                status: 'processing'
            }
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found or not assigned to you' });
        }

        transaction.status = 'sent';
        await transaction.save();

        res.json({ message: 'Transaction marked as sent', transaction });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    toggleStatus,
    getAvailablePool,
    getHandledTransactions,
    acceptTransaction,
    completeTransaction
};
