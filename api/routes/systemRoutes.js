const express = require('express');
const router = express.Router();
const { getPaymentMethods, updatePaymentMethod } = require('../controllers/systemController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Public route to get payment instructions (e.g., for User Dashboard)
router.get('/payment-methods', verifyToken, getPaymentMethods);

// Admin route to update payment instructions
router.post('/payment-methods', verifyAdmin, updatePaymentMethod);

module.exports = router;
