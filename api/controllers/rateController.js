const { Rate } = require('../models');
const axios = require('axios'); // Needed for external API, ensure it's installed or use fetch

const getRates = async (req, res) => {
    try {
        // Find existing rate record or create one
        let rateRecord = await Rate.findOne({ where: { pair: 'GHS-CAD' } });

        if (!rateRecord) {
            rateRecord = await Rate.create({
                pair: 'GHS-CAD',
                rate: 0.10, // Initial default
                use_api: false, // Default to manual as requested
                manual_rate: 10.0, // 1 CAD = 10 GHS
                spread: 5.0
            });
        }

        let finalRate = rateRecord.rate;
        let marketRateCADtoGHS = null;

        // Fetch market rate for reference
        try {
            const response = await axios.get('https://api.exchangerate-api.com/v4/latest/CAD');
            marketRateCADtoGHS = response.data.rates.GHS;
        } catch (apiError) {
            console.error('External API error:', apiError.message);
        }

        res.json({
            pair: 'GHS-CAD',
            rate: parseFloat(finalRate),
            market_rate_cad_ghs: marketRateCADtoGHS,
            use_api: rateRecord.use_api,
            spread: rateRecord.spread,
            manual_rate_cad_ghs: parseFloat(rateRecord.manual_rate),
            updatedAt: rateRecord.updatedAt
        });
    } catch (error) {
        console.error('Rate fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch rates' });
    }
};

const updateRateSettings = async (req, res) => {
    try {
        const { use_api, manual_rate, spread } = req.body;

        let rateRecord = await Rate.findOne({ where: { pair: 'GHS-CAD' } });
        if (!rateRecord) {
            rateRecord = await Rate.create({ pair: 'GHS-CAD' });
        }

        if (use_api !== undefined) rateRecord.use_api = use_api;
        if (manual_rate !== undefined) rateRecord.manual_rate = manual_rate;
        if (spread !== undefined) rateRecord.spread = spread;

        // Re-calculate the actual transaction rate immediately to ensure persistence
        if (rateRecord.use_api) {
            try {
                const response = await axios.get('https://api.exchangerate-api.com/v4/latest/CAD');
                const marketRate = response.data.rates.GHS;
                if (marketRate) {
                    const adjustedCADtoGHS = marketRate * (1 + (rateRecord.spread || 5.0) / 100);
                    rateRecord.rate = (1 / adjustedCADtoGHS).toFixed(6);
                }
            } catch (apiError) {
                console.error('Sync error in update:', apiError.message);
                // Fallback to manual calculation if API fails during toggle
                const manualCADtoGHS = rateRecord.manual_rate || 10.0;
                rateRecord.rate = (1 / manualCADtoGHS).toFixed(6);
            }
        } else {
            const manualCADtoGHS = rateRecord.manual_rate || 10.0;
            rateRecord.rate = (1 / manualCADtoGHS).toFixed(6);
        }

        await rateRecord.save();

        res.json({ message: 'Rate settings updated', settings: rateRecord });
    } catch (error) {
        console.error('Update rate error:', error);
        res.status(500).json({ error: 'Failed to update rate settings' });
    }
};

module.exports = { getRates, updateRateSettings };
