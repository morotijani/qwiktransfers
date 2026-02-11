const express = require('express');
const router = express.Router();
const { getRates, updateRateSettings } = require('../controllers/rateController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', getRates);
router.patch('/settings', verifyToken, verifyAdmin, updateRateSettings);

module.exports = router;
