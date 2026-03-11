# Code Hunters – Digital Products Store

A Node.js + Express storefront with Razorpay payment integration for selling digital products.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Local Development](#local-development)
4. [Environment Variables](#environment-variables)
5. [Deploying to Vercel (Recommended)](#deploying-to-vercel-recommended)
6. [Deploying to Other Platforms](#deploying-to-other-platforms)
7. [After Deployment – Configure Razorpay](#after-deployment--configure-razorpay)

---

## Project Structure

```
/
├── server.js              ← Express backend (API + static file serving)
├── package.json
├── vercel.json            ← Vercel deployment config
├── .env                   ← Environment variables (never commit this)
├── checkout.html          ← Checkout page
├── success.html           ← Payment success page
├── sp/
│   └── developers-kit.html  ← Landing page (default route /)
├── PAyment_gate/          ← Shop, cart, and product pages
├── css/                   ← Stylesheets
├── js/                    ← Scripts
├── fonts/                 ← Fonts
└── images/                ← Images
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)
- A [Razorpay account](https://razorpay.com/) for live/test payments

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example and fill in your Razorpay keys:

```bash
# Edit .env:
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
PORT=3000
```

> Use **test mode keys** (`rzp_test_...`) while developing.  
> Get your keys at: https://dashboard.razorpay.com/app/keys

### 3. Start the server

```bash
npm start
```

The server starts at **http://localhost:3000**

| URL | Page |
|-----|------|
| http://localhost:3000/ | Redirects to landing page |
| http://localhost:3000/sp/developers-kit.html | Developer's Kit landing page |
| http://localhost:3000/checkout.html | Checkout |
| http://localhost:3000/PAyment_gate/shop.html | Shop |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RAZORPAY_KEY_ID` | Yes (for payments) | Your Razorpay Key ID (starts with `rzp_`) |
| `RAZORPAY_KEY_SECRET` | Yes (for payments) | Your Razorpay Key Secret |
| `PORT` | No | Server port (default: `3000`) |

> **Important:** Never commit `.env` to Git. It is already listed in `.gitignore` (add it if missing).

---

## Deploying to Vercel (Recommended)

Vercel is the easiest platform for this project. Follow these steps exactly.

### Step 1 – Push your code to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

> **Make sure `.env` is in your `.gitignore` so your secrets are never pushed.**

### Step 2 – Import the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use your GitHub account).
2. Click **"Add New Project"**.
3. Click **"Import"** next to your GitHub repository.

### Step 3 – Configure the project settings

On the "Configure Project" screen, set the following:

| Setting | Value |
|---|---|
| **Framework Preset** | `Other` |
| **Root Directory** | ` ` *(leave blank / keep as `.`)* |
| **Build Command** | *(leave blank – no build step needed)* |
| **Output Directory** | *(leave blank)* |
| **Install Command** | `npm install` *(Vercel auto-fills this)* |

> **Root Directory** must be left as the default (blank or `.`).  
> Do NOT set it to `sp/` or `PAyment_gate/` — the whole repo root is the project root.

### Step 4 – Add Environment Variables

Still on the same screen, scroll to **"Environment Variables"** and add:

| NAME | VALUE |
|---|---|
| `RAZORPAY_KEY_ID` | `rzp_live_XXXXXXXXXXXXXXXX` |
| `RAZORPAY_KEY_SECRET` | `XXXXXXXXXXXXXXXXXXXXXXXX` |

> Use **live mode keys** (`rzp_live_...`) for production.  
> You can also add `NODE_ENV=production` here.

### Step 5 – Deploy

Click **"Deploy"**. Vercel will:
1. Install dependencies (`npm install`)
2. Bundle `server.js` as a serverless function
3. Include all HTML, CSS, JS, images, and fonts

After ~1 minute your site is live at `https://your-project.vercel.app`

The root URL (`/`) automatically redirects to `/sp/developers-kit.html`.

### Updating after deployment

Every `git push` to your `main` branch triggers an automatic redeploy on Vercel.

To update environment variables later:
- Vercel Dashboard → Your Project → Settings → Environment Variables

---

## Deploying to Other Platforms

### Railway / Render / Heroku (any Node.js host)

These platforms run `npm start` directly, so they work with zero extra configuration.

1. Connect your GitHub repository to the platform.
2. Set environment variables in the platform's dashboard (same as the table above).
3. The platform auto-detects `package.json` and runs `npm start`.
4. Make sure the platform sets the `PORT` environment variable — the app reads `process.env.PORT` automatically.

### VPS / Linux Server (DigitalOcean, AWS EC2, etc.)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# Install dependencies
npm install

# Create .env with your keys
nano .env

# Run with PM2 for auto-restart on crash
npm install -g pm2
pm2 start server.js --name codehunters
pm2 startup   # auto-start on server reboot
pm2 save
```

Set up Nginx as a reverse proxy on port 80/443, pointing to `localhost:3000`.

---

## After Deployment – Configure Razorpay

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings → API Keys** and generate live-mode keys.
3. Go to **Settings → Webhooks** and add your deployment URL:
   - Webhook URL: `https://your-domain.com/api/verify-payment`
   - Events to select: `payment.captured`
4. Replace the environment variables in your hosting platform with the live keys.
5. **Test a purchase** using Razorpay's test card numbers before going live.

### Razorpay Test Card Numbers

| Card Number | CVV | Expiry |
|---|---|---|
| `4111 1111 1111 1111` | Any 3 digits | Any future date |
| `5267 3181 8797 5449` | Any 3 digits | Any future date |

---

## Common Issues

| Error | Cause | Fix |
|---|---|---|
| `Cannot GET /sp/developers-kit.html` | `vercel.json` missing or not deployed | Ensure `vercel.json` is committed and re-deploy |
| `Razorpay not configured` | Empty or placeholder keys in `.env` | Add real API keys to environment variables |
| `Payment verification failed` | Wrong Key Secret | Double-check `RAZORPAY_KEY_SECRET` — it must match the Key ID |
| `Port already in use` | Another process on port 3000 | Change `PORT=3001` in `.env` |
