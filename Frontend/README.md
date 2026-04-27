# Trading CRM — Full Application Overview

A full-stack financial trading CRM platform for managing clients, trading accounts, deposits, withdrawals, IB partner commissions, KYC verification, and real-time notifications. Built with React + TypeScript on the frontend and Node.js + Express + MongoDB on the backend, with MetaTrader 5 (MT5) API integration.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Features by Role](#features-by-role)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Step-by-Step Run Instructions](#step-by-step-run-instructions)
- [Deployment Notes](#deployment-notes)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                              │
│                                                                      │
│   React 18 + TypeScript + Vite (Port 5173)                          │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │
│   │  Client  │ │  Admin   │ │  Agent   │ │    SuperAdmin        │  │
│   │  Portal  │ │  Portal  │ │  Portal  │ │    Portal            │  │
│   └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘  │
│        │              │           │                │                 │
│        └──────────────┴───────────┴────────────────┘                │
│                              │                                       │
│              Axios HTTP + Socket.io (WebSocket)                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER (Port 3210)                      │
│                                                                      │
│   Node.js + Express.js                                               │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                        Middleware                            │   │
│   │   Helmet │ CORS │ Rate Limiter │ JWT Auth │ Mongo Sanitize  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│   ┌───────────┬───────────────┼───────────────┬──────────────────┐  │
│   │  /api/    │  /api/admin/  │ /api/clients/ │  /api/ibclients/ │  │
│   │  (auth,   │  (deposits,   │ (dashboard,   │  (commission,    │  │
│   │  tickets, │  withdrawals, │  profile,     │  withdrawal,     │  │
│   │  notify)  │  kyc, mgmt)   │  trading)     │  configuration)  │  │
│   └───────────┴───────────────┴───────────────┴──────────────────┘  │
│                               │                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                      Services Layer                          │  │
│   │  accountSyncService │ tradeSyncService │ commissionService   │  │
│   │  emailService │ notificationService │ cronJobService         │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                               │                                      │
│   ┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐  │
│   │   Socket.io     │   │   node-cron     │   │   Multer/Upload  │  │
│   │  (Real-time     │   │  (Scheduled     │   │  (File Storage)  │  │
│   │   Events)       │   │   Jobs)         │   │                  │  │
│   └─────────────────┘   └─────────────────┘   └──────────────────┘  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
              ┌───────────────────┼──────────────────────┐
              │                   │                      │
              ▼                   ▼                      ▼
┌─────────────────────┐ ┌──────────────────┐ ┌─────────────────────┐
│   MongoDB           │ │   MT5 API        │ │   AWS SES (Email)   │
│   (Port 27017)      │ │   (External)     │ │   (SMTP Port 587)   │
│                     │ │   Trading Data   │ │                     │
│   21 Collections    │ │   Account Sync   │ │   Transactional     │
│   Pool: 10–100      │ │   Trade Sync     │ │   Notifications     │
└─────────────────────┘ └──────────────────┘ └─────────────────────┘
```

### Data Flow

```
User Action (Browser)
      │
      ▼
React Component → Axios API Call → Express Route
                                        │
                                        ▼
                               JWT Middleware (auth.js)
                                        │
                                        ▼
                               Controller (Business Logic)
                                        │
                          ┌─────────────┴──────────────┐
                          │                            │
                          ▼                            ▼
                   MongoDB (Mongoose)          MT5 API / Email
                          │
                          ▼
                   Response → Axios → React State Update
                                            │
                                            ▼
                                   Socket.io (real-time push)
                                   → Notification Toast / UI Update
```

---

## Tech Stack

### Frontend

| Category | Technology |
|---|---|
| Framework | React 18.3.1 + TypeScript |
| Build Tool | Vite 6.2.2 (SWC plugin) |
| Styling | TailwindCSS 3.4, styled-components 6 |
| UI Components | Radix UI, Material-UI 6.4, shadcn/ui |
| State Management | Redux Toolkit, Zustand |
| API Client | Axios |
| Real-time | Socket.io-client |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts, D3.js |
| Date Handling | date-fns, dayjs, MUI DatePickers |
| Document Export | jsPDF, ExcelJS, docx |
| Router | React Router v6 |

### Backend

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js 4.21 |
| Database | MongoDB + Mongoose 8.12 |
| Authentication | JWT (jsonwebtoken), bcryptjs |
| Validation | Joi 17, Zod 3.23 |
| Real-time | Socket.io 4.8 |
| Email | Nodemailer + AWS SES (SMTP) |
| File Upload | multer, express-fileupload |
| Document Export | pdfkit, ExcelJS, docx |
| Scheduling | node-cron |
| Security | helmet, express-mongo-sanitize, express-rate-limit |
| Trading API | MT5 REST API (MetaTrader 5) |

---

## User Roles

The platform has four distinct roles, each with a separate portal and permissions:

| Role | Login Path | Description |
|---|---|---|
| **Client** | `/auth/sign-in` | Traders who manage their own accounts, deposits, withdrawals, and referrals |
| **Admin** | `/admin/login` | Platform managers who approve transactions, manage KYC, and view analytics |
| **Agent** | `/agent/login` | Sales agents with limited management access |
| **SuperAdmin** | `/superadmin/login` | Full platform control including admin registration and theme settings |

---

## Features by Role

### Client Portal
- Dashboard with trading performance charts (equity, balance, revenue)
- Trading account management (open new accounts, view balances)
- Financial operations: deposit, withdrawal, internal transfer
- Transaction history
- IB (Introducing Broker) Partner dashboard — commission tracking, sub-client management
- IB withdrawal requests
- Referral system — invite friends, track referrals
- Copy trading — follow other traders
- Trading platform access (MT5 integration)
- Support ticket system
- Profile management with KYC document upload

### Admin Portal
- Dashboard with aggregated analytics (client count, revenue, trade volume)
- Client management — view, edit, impersonate clients
- Deposit approval / rejection workflow
- Withdrawal approval / rejection workflow
- KYC verification — review and approve identity documents
- IB Partner management — view partner trees, commission settings
- IB withdrawal management
- Transaction oversight
- Support ticket management
- Agent registration
- System configuration (payment methods, leverages, groups, exchanges)

### SuperAdmin Portal
- All admin capabilities
- Register new admin accounts
- Platform-wide theme customization (colors, logos, site name)
- System configuration

### Agent Portal
- Client-focused view with assigned client management

---

## Project Structure

```
CRM/
├── Frontend/                          # React + TypeScript application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/sign-in/          # Login, Signup, Password reset
│   │   │   ├── client/                # Client portal pages
│   │   │   │   ├── Dashboard/         # Performance charts & metrics
│   │   │   │   ├── financial/         # Deposit, Withdrawal, Transfer, History
│   │   │   │   ├── account/           # Account list & management
│   │   │   │   ├── Partner/           # IB partner dashboard & commissions
│   │   │   │   ├── Refer/             # Referral management
│   │   │   │   ├── copy/              # Copy trading
│   │   │   │   ├── Trading/           # Trading platform links
│   │   │   │   └── support/           # Support tickets
│   │   │   ├── admin/                 # Admin portal pages
│   │   │   │   ├── dashboard/         # Analytics dashboard
│   │   │   │   ├── features/          # Clients, Deposits, Withdrawals, KYC
│   │   │   │   ├── Ibpartner/         # IB partner management
│   │   │   │   ├── configure/         # System configuration
│   │   │   │   ├── support/           # Ticket management
│   │   │   │   ├── copy/              # Copy trading admin
│   │   │   │   └── agent/             # Agent registration
│   │   │   ├── agent/                 # Agent portal
│   │   │   └── superAdmin/            # SuperAdmin portal
│   │   │       ├── configure/         # Platform-wide settings
│   │   │       ├── AdminRegistration.tsx
│   │   │       └── ThemeSettingsPage.tsx
│   │   ├── components/
│   │   │   ├── ui/                    # Reusable UI components (Radix-based)
│   │   │   └── notifications/         # Notification components
│   │   ├── context/
│   │   │   ├── ThemeContext.tsx        # Dark/light mode
│   │   │   └── NotificationContext.tsx # Push notifications
│   │   ├── hooks/
│   │   │   ├── useAuth.tsx             # Auth state & user data
│   │   │   ├── useDashboardData.ts     # Dashboard data fetching
│   │   │   └── use-mobile.tsx          # Responsive detection
│   │   ├── services/
│   │   │   └── adminDashboardApi.ts    # Admin API calls
│   │   ├── utils/
│   │   │   ├── authHandler.ts          # Auth utilities
│   │   │   └── impersonation.ts        # Admin impersonation helper
│   │   ├── lib/
│   │   │   └── types.ts                # TypeScript types
│   │   ├── router.tsx                  # Role-based route definitions
│   │   ├── App.tsx                     # Root component + providers
│   │   └── main.tsx                    # Entry point
│   ├── .env                            # Frontend env vars
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
└── Backend/                           # Node.js + Express application
    ├── index.js                       # Server entry point
    ├── config/
    │   ├── db.js                      # MongoDB connection (pool: 10–100)
    │   └── config.js                  # Environment config exports
    ├── routes/
    │   ├── authRoutes.js
    │   ├── ticketRoutes.js
    │   ├── notificationRoutes.js
    │   ├── admin/                     # 8 admin route files
    │   └── client/                    # 11 client route files
    ├── controllers/
    │   ├── authController.js
    │   ├── admin/                     # 8 admin controllers
    │   └── client/                    # 12 client controllers
    ├── models/                        # 21 Mongoose schemas
    │   ├── User.js
    │   ├── Deposit.js
    │   ├── withdrawal.js
    │   ├── Notification.js
    │   ├── Ticket.js
    │   ├── IBCommission.js
    │   ├── ThemeSettings.js
    │   ├── admin/
    │   └── client/
    ├── services/
    │   ├── accountSyncService.js      # Auto-sync MT5 accounts
    │   ├── tradeSyncService.js        # Auto-sync MT5 trades
    │   ├── commissionService.js       # IB commission calculations
    │   ├── emailService.js            # AWS SES email sending
    │   ├── notificationService.js     # In-app notifications
    │   └── cronJobService.js          # Scheduled tasks
    ├── middlewares/
    │   ├── auth.js                    # JWT protect & role authorize
    │   └── upload.js                  # File upload handling
    ├── utils/
    │   ├── sendEmail.js               # Nodemailer + SES
    │   ├── emailTemplates.js          # HTML email templates
    │   ├── socketServer.js            # Socket.io initialization
    │   └── exportUtils.js             # PDF/Excel export helpers
    ├── websocket/
    │   └── socket.js                  # WebSocket event handlers
    ├── api/
    │   └── metaApi.js                 # MT5 REST API client
    ├── uploads/                       # Uploaded files storage
    ├── .env
    └── package.json
```

---

## Database Models

| Model | Collection | Description |
|---|---|---|
| User | users | All users (all roles), hashed passwords, JWT |
| Account | accounts | MT5 trading accounts per client |
| Profile | profiles | Extended client profile, KYC status |
| Deposit | deposits | Deposit requests and approvals |
| Withdrawal | withdrawals | Client withdrawal requests |
| Transfer | transfers | Internal wallet-to-account transfers |
| IBCommission | ibcommissions | Commission earned by IB partners |
| IBClosedTrade | ibclosedtrades | Closed trades linked to IB |
| IBWithdrawal | ibwithdrawals | IB partner withdrawal requests |
| IBClientConfiguration | ibclientconfigurations | IB partner settings per client |
| IBAdminConfiguration | ibadminconfigurations | Admin-defined IB rules |
| Copy | copies | Copy trading configurations |
| Notification | notifications | In-app notifications per user |
| Ticket | tickets | Support tickets and messages |
| Group | groups | User account groupings |
| Leverage | leverages | Available leverage options |
| PaymentMethod | paymentmethods | Configured payment methods |
| Exchange | exchanges | Exchange integrations |
| ThemeSettings | themesettings | UI theme (logo, colors, site name) |
| Message | messages | Internal messaging |
| Attachment | attachments | Uploaded file metadata |

---

## API Endpoints

### Authentication (`/api/auth`)
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login (all roles)
POST   /api/auth/forgot-password   Send reset email
POST   /api/auth/reset-password/:token  Reset password
```

### Client Endpoints
```
GET/PUT  /api/profile              Client profile
GET/POST /api/accounts             Trading accounts
POST     /api/clientdeposits       Request deposit
GET      /api/transactions         Transaction history
POST     /api/withdrawals          Request withdrawal
POST     /api/transfers            Internal transfer
GET/POST /api/tickets              Support tickets
GET      /api/notifications        Notifications
GET      /api/ibclients/commission Commission earnings
POST     /api/ibclients/ibwithdrawal IB withdrawal request
GET      /api/clientdashboard      Client dashboard data
GET      /api/trading              Trading platform data
```

### Admin Endpoints
```
GET      /api/clients              All clients
GET/PUT  /api/admindeposits        Deposit approvals
GET/PUT  /api/adminwithdrawals     Withdrawal approvals
GET      /api/admin/transactions   All transactions
GET/PUT  /api/kyc                  KYC verification
GET      /api/admin/dashboard      Analytics dashboard
GET      /api/ibpartners           IB partner management
GET      /api/ibadmin/withdrawals  IB withdrawal management
```

### System Configuration (Admin/SuperAdmin)
```
GET/POST/PUT  /api/leverages       Leverage options
GET/POST/PUT  /api/groups          User groups
GET/POST/PUT  /api/payment-methods Payment methods
GET/POST/PUT  /api/exchanges       Exchange integrations
GET/PUT       /api/theme           Theme settings
```

### Real-time (Socket.io)
```
Event: notification       New notification push
Event: deposit_update     Deposit status change
Event: withdrawal_update  Withdrawal status change
Event: kyc_update         KYC status change
```

---

## Environment Variables

### Backend — `Backend/.env`

```env
NODE_ENV=development
PORT=3210
MONGO_URI=mongodb://localhost:27017/crm

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=1d

CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3210
SITE_NAME=YourCRMName

# MT5 Trading API
MT5_API_URL=https://your-mt5-api-url/api/mt5
MT5_API_KEY=your-mt5-api-key
Manager_Index=1

# AWS SES Email
EMAIL_SERVICE=ses
SMTP_HOST=email-smtp.eu-north-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_smtp_user
SMTP_PASS=your_aws_smtp_password
EMAIL_FROM=admin@yourdomain.com
```

### Frontend — `Frontend/.env`

```env
VITE_API_URL=http://localhost:3210
VITE_CLIENT_URL=http://localhost:5173
VITE_SITE_NAME=Your CRM Name
VITE_SERVER_NAME=Your Server Name
```

---

## Step-by-Step Run Instructions

### Prerequisites

Make sure the following are installed on your machine:

| Tool | Version | Check |
|---|---|---|
| Node.js | v18+ | `node -v` |
| npm | v9+ | `npm -v` |
| MongoDB | v6+ | `mongod --version` |
| Git | any | `git --version` |

---

### Step 1 — Clone / Navigate to Project

```bash
cd "f:/Company/NEW CRM/CRM"
```

---

### Step 2 — Start MongoDB

Make sure MongoDB is running locally before starting the backend.

```bash
# Windows (run as Administrator or use the service)
net start MongoDB

# Or start manually
mongod --dbpath "C:/data/db"
```

Verify MongoDB is running:
```bash
mongosh
# Should connect to mongodb://localhost:27017
```

---

### Step 3 — Setup and Run the Backend

```bash
# Navigate to backend
cd Backend

# Install dependencies
npm install

# Create environment file (copy from template and fill in values)
# Edit .env with your MongoDB URI, JWT secret, MT5 API key, SMTP credentials
# (see Environment Variables section above)

# Start the backend server
npm start
```

The backend will start on **http://localhost:3210**

You should see:
```
MongoDB Connected: localhost
Server running on port 3210
Account sync service started
Trade sync service started
```

To run with auto-reload during development (if nodemon is available):
```bash
npm run dev
# or
npx nodemon index.js
```

---

### Step 4 — Setup and Run the Frontend

Open a **new terminal window** (keep the backend running):

```bash
# Navigate to frontend
cd Frontend

# Install dependencies
npm install

# Ensure .env is configured
# VITE_API_URL should point to http://localhost:3210

# Start the development server
npm run dev
```

The frontend will start on **http://localhost:5173**

---

### Step 5 — Access the Application

Open your browser and navigate to:

| Portal | URL | Role |
|---|---|---|
| Client Login | http://localhost:5173/auth/sign-in | client |
| Admin Login | http://localhost:5173/admin/login | admin |
| Agent Login | http://localhost:5173/agent/login | agent |
| SuperAdmin Login | http://localhost:5173/superadmin/login | superadmin |

---

### Step 6 — Create the First SuperAdmin (First-Time Setup)

Since there is no default user, you need to register the first account via the API directly:

```bash
# Using curl — register the first superadmin
curl -X POST http://localhost:3210/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Super Admin",
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123",
    "role": "superadmin"
  }'
```

Or use Postman / Thunder Client (VS Code extension) to POST to `/api/auth/register`.

---

### Health Check

Verify the backend is up:
```bash
curl http://localhost:3210/api/health
# Expected: { "status": "ok" }
```

---

### Build for Production

**Frontend:**
```bash
cd Frontend
npm run build
# Output: Frontend/dist/
```

**Backend:**
```bash
# Backend runs as-is with Node.js — no build step needed
# For production, use PM2:
npm install -g pm2
pm2 start index.js --name "crm-backend"
pm2 save
pm2 startup
```

---

## Deployment Notes

### Frontend (Vercel / Static Host)
- A `vercel.json` is included in `Frontend/` — deploy directly from the `Frontend/` folder
- Set all `VITE_*` environment variables in the Vercel dashboard
- Set `VITE_API_URL` to your production backend URL

### Backend (VPS / Windows Server / IIS)
- A `web.config` is included for IIS deployment on Windows Server
- Set `NODE_ENV=production` in `.env`
- Use PM2 or IIS Node for process management
- Ensure MongoDB is accessible from the server (either local or Atlas URI)

### MongoDB Atlas (Cloud)
Replace the local URI in `.env`:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/crm?retryWrites=true&w=majority
```

### CORS Configuration
The backend currently allows all origins (`"*"`). For production, update `index.js` to restrict to your frontend domain:
```js
cors({ origin: process.env.CLIENT_URL })
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `ECONNREFUSED 27017` | MongoDB not running | Run `net start MongoDB` or `mongod` |
| `401 Unauthorized` | JWT token missing or expired | Re-login; check `JWT_SECRET` matches in `.env` |
| Blank page on frontend | `VITE_API_URL` wrong | Set correct backend URL in `Frontend/.env` |
| Emails not sending | SES credentials wrong | Verify `SMTP_USER` / `SMTP_PASS` in `.env` |
| MT5 data not syncing | MT5 API unreachable | Check `MT5_API_URL` and `MT5_API_KEY` |
| `CORS error` in browser | Backend CORS not allowing frontend origin | Add `CLIENT_URL` to CORS config in `index.js` |
