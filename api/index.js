const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./models');

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

const rateLimit = require('express-rate-limit');

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const rateRoutes = require('./routes/rateRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const systemRoutes = require('./routes/systemRoutes');
const { startRateWatcher } = require('./rateWatcher');

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/rates', rateRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/system', systemRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Qwiktransfers API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    // A Multer error occurred when uploading.
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    // An unknown error occurred when uploading or elsewhere.
    return res.status(500).json({ error: err.message });
  }
  next();
});

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      startRateWatcher();
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

startServer();
