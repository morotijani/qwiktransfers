# QwikTransfers

A fintech platform for money transfers between Ghana (GHS) and Canada (CAD) with manual admin verification.

## 🚀 Tech Stack

- **Backend**: Node.js + Express + PostgreSQL + Sequelize
- **Web**: React + Vite + React Router
- **Mobile**: React Native + Expo + React Navigation

## 📦 Project Structure

```
qwiktransfers/
├── api/        # Backend API
├── web/        # Web Frontend
└── mobile/     # Mobile App
```

## 🏃 Quick Start

### Backend
```bash
cd api
npm install
npm run dev
```
Server runs on `http://localhost:5000`

### Web
```bash
cd web
npm install
npm run dev
```
App runs on `http://localhost:5173`

### Mobile
```bash
cd mobile
npm install
npm run web      # Browser testing
npm run android  # Android
```

## 🔑 Features

- ✅ JWT Authentication
- ✅ User Dashboard (Send Money)
- ✅ Admin Dashboard (Manage Transactions)
- ✅ Transaction Status Tracking (Pending → Processing → Sent)
- ✅ Exchange Rate Calculation
- ✅ Mobile App with Pull-to-Refresh

## 📝 API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile
- `POST /api/transactions` - Create transaction
- `GET /api/transactions` - List transactions
- `PATCH /api/transactions/:id/status` - Update status (admin)
- `GET /api/rates` - Get exchange rates

## 🗄️ Database Setup

1. Install PostgreSQL
2. Update credentials in `api/config/config.json`
3. Run migrations:
```bash
cd api
npx sequelize-cli db:create
npx sequelize-cli db:migrate
```

## 📱 Testing

1. Create admin user via API
2. Register regular user via web/mobile
3. User sends money request
4. Admin processes transaction
5. User sees updated status

## 📚 Documentation

See [walkthrough.md](.gemini/antigravity/brain/bcbf6e78-c99c-4702-a476-485520086893/walkthrough.md) for detailed documentation.

## 🔐 Security Notes

- Change default JWT secret in production
- Use environment variables for sensitive data
- Implement KYC verification
- Add rate limiting

## 📄 License

MIT
