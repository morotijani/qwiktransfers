const express = require('express');
const router = express.Router();
const { createTransaction, getTransactions, updateStatus, uploadProof, cancelTransaction, exportTransactions } = require('../controllers/transactionController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', verifyToken, createTransaction);
router.get('/', verifyToken, getTransactions);
router.get('/export', verifyToken, exportTransactions);
router.patch('/:id/status', verifyAdmin, updateStatus);
router.patch('/:id/cancel', verifyToken, cancelTransaction);
router.post('/:id/upload-proof', verifyToken, upload.single('proof'), uploadProof);

module.exports = router;
