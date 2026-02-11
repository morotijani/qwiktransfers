const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { verifyVendor } = require('../middleware/authMiddleware');

router.use(verifyVendor);

router.post('/toggle-status', vendorController.toggleStatus);
router.get('/pool', vendorController.getAvailablePool);
router.get('/transactions', vendorController.getHandledTransactions);
router.post('/accept', vendorController.acceptTransaction);
router.post('/complete', vendorController.completeTransaction);

module.exports = router;
