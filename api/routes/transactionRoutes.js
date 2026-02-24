const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, getTransactionById, updateStatus, uploadProof, cancelTransaction, exportTransactions, getAdminStats } = require('../controllers/transactionController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', verifyToken, createTransaction);
router.get('/', verifyToken, getTransactions);
router.get('/stats', verifyAdmin, getAdminStats);
router.get('/export', verifyToken, exportTransactions);
router.patch('/:id/status', verifyAdmin, updateStatus);
router.patch('/:id/cancel', verifyToken, cancelTransaction);
router.post('/:id/upload-proof', verifyToken, upload.single('proof'), uploadProof);
router.get('/:id', verifyToken, getTransactionById);

module.exports = router;
