const { PaymentMethod } = require('../models');

const getPaymentMethods = async (req, res) => {
    try {
        // Public endpoint: Fetch all active payment methods
        const methods = await PaymentMethod.findAll({
            where: { is_active: true }
        });
        res.json(methods);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updatePaymentMethod = async (req, res) => {
    try {
        // Admin endpoint: Update or Create a payment method
        const { type, currency, details, is_active } = req.body;

        if (!type || !currency) {
            return res.status(400).json({ error: 'Type and Currency are required' });
        }

        let method = await PaymentMethod.findOne({ where: { type, currency } });

        if (method) {
            method.details = details;
            method.is_active = is_active !== undefined ? is_active : method.is_active;
            await method.save();
        } else {
            method = await PaymentMethod.create({
                type,
                currency,
                details,
                is_active: is_active !== undefined ? is_active : true
            });
        }

        res.json({ message: 'Payment method updated', method });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPaymentMethods,
    updatePaymentMethod
};
