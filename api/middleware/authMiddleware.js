const jwt = require('jsonwebtoken');
const { User } = require('../models');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ error: 'No token provided' });

    jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'secret', async (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Failed to authenticate token' });

        try {
            const user = await User.findByPk(decoded.id);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            if (user.is_active === false) {
                return res.status(403).json({ error: 'Account is disabled' });
            }

            // Update req.user with full user object (optional, or just keep decoded + status check)
            // Keeping it simple: attach decoded, but we verified existence and status.
            req.user = decoded;
            next();
        } catch (dbError) {
            return res.status(500).json({ error: 'Internal server error during auth' });
        }
    });
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Require Admin Role!' });
        }
    });
};

const verifyVendor = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'vendor' || req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ error: 'Require Vendor or Admin Role!' });
        }
    });
};

module.exports = { verifyToken, verifyAdmin, verifyVendor };
