require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { google } = require('googleapis');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Product catalog (prices from actual product pages) ---
const PRODUCTS = {
  'developers-kit': {
    id: 'developers-kit',
    name: "Developer's Kit – 700+ Job-Ready Projects Bundle",
    price: 369,
    currency: 'INR',
    description: '700+ real-world projects across 10+ technologies with lifetime access & updates'
  },
  '30-day-data-analyst-kit': {
    id: '30-day-data-analyst-kit',
    name: '30-Day Data Analyst Kit',
    price: 299,
    currency: 'INR',
    description: 'Complete data analyst preparation kit – 30 day structured plan'
  },
  '5-day-js-bootcamp': {
    id: '5-day-js-bootcamp',
    name: '5-Day JavaScript Bootcamp',
    price: 201,
    currency: 'INR',
    description: '5-day intensive JavaScript for everything bootcamp'
  },
  'interview-mastery': {
    id: 'interview-mastery',
    name: 'Interview Mastery System – Clear Every Interview Round',
    price: 1499,
    currency: 'INR',
    description: 'Complete interview preparation system covering every round'
  },
  'interview-cracking-2026': {
    id: 'interview-cracking-2026',
    name: 'Complete Interview-Cracking System (2026 AI-Based)',
    price: 399,
    currency: 'INR',
    description: 'AI-powered interview cracking system for 2026'
  },
  'Testing-First': {
    id: 'Testing-First',
    name: 'Testing First',
    price: 3,
    currency: 'INR',
    description: 'Complete Tests'
  },
  'ats-resume-template': {
    id: 'ats-resume-template',
    name: 'ATS Approved Resume Template - WebDev',
    price: 129,
    currency: 'INR',
    description: 'ATS-approved resume template designed for web developers'
  },
  'vip-pass': {
    id: 'vip-pass',
    name: 'Upgrade to VIP Pass',
    price: 149,
    currency: 'INR',
    description: 'VIP pass upgrade with exclusive benefits'
  }
};

// --- Order key generation (like wc_order_6aAljJBEgvnDB) ---
let orderCounter = 1000;
function generateOrderKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'ch_order_';
  const bytes = crypto.randomBytes(13);
  for (let i = 0; i < 13; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}
function getNextOrderNumber() {
  return ++orderCounter;
}

// --- Razorpay instance (lazy, only if keys configured) ---
function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || keyId.includes('REPLACE') || !keySecret || keySecret.includes('REPLACE')) {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// --- Google Drive + email delivery ---
const resend = new Resend(process.env.RESEND_API_KEY);

function getDriveClient() {
  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

async function grantAccess(customerEmail, paymentId) {
  const folderId = process.env.GDRIVE_FOLDER_ID;
  if (!folderId || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.warn('Drive delivery not configured — skipping access grant');
    return;
  }
  const drive = getDriveClient();
  // Share folder — Drive silently ignores duplicate grants for the same email
  await drive.permissions.create({
    fileId: folderId,
    requestBody: { type: 'user', role: 'reader', emailAddress: customerEmail },
    sendNotificationEmail: false,
    fields: 'id',
  });
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Code Hunters <noreply@codehunters.dev>',
      to: customerEmail,
      subject: '\u2705 Your Code Hunters Access is Ready',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,'Helvetica Neue',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10);">

  <!-- HEADER -->
  <tr>
    <td style="background:#111;padding:24px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Code <span style="color:#E8440A;">Hunters</span></span><br>
            <span style="color:#888;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Developer Education Platform</span>
          </td>
          <td align="right" valign="middle">
            <span style="background:#E8440A;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;letter-spacing:.5px;white-space:nowrap;">ORDER CONFIRMED</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td style="background:#fff;padding:40px 36px 28px;text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
        <tr>
          <td style="width:64px;height:64px;background:#22c55e;border-radius:50%;text-align:center;vertical-align:middle;">
            <span style="color:#fff;font-size:34px;line-height:1;font-weight:700;">&#10003;</span>
          </td>
        </tr>
      </table>
      <h1 style="margin:0 0 10px;color:#111;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Payment Confirmed &mdash; You&rsquo;re All Set!</h1>
      <p style="margin:0;color:#555;font-size:15px;line-height:1.7;">
        Your projects have been shared directly to your Google account.<br>
        No passwords, no waiting &mdash; just click and start building.
      </p>
    </td>
  </tr>

  <!-- WHAT'S INCLUDED -->
  <tr>
    <td style="background:#fff;padding:0 36px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e8e8e8;">
        <tr>
          <td style="background:#111;padding:11px 20px;">
            <span style="color:#E8440A;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">What You Now Have Access To</span>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:16px 20px;">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr><td style="padding:6px 0;color:#222;font-size:14px;line-height:1.5;"><span style="color:#22c55e;font-weight:800;margin-right:10px;">&#10003;</span>700+ real-world projects across 10+ technologies</td></tr>
              <tr><td style="padding:6px 0;color:#222;font-size:14px;line-height:1.5;border-top:1px solid #eee;"><span style="color:#22c55e;font-weight:800;margin-right:10px;">&#10003;</span>Lifetime access &mdash; all future updates included automatically</td></tr>
              <tr><td style="padding:6px 0;color:#222;font-size:14px;line-height:1.5;border-top:1px solid #eee;"><span style="color:#22c55e;font-weight:800;margin-right:10px;">&#10003;</span>Shared privately to your Google account — no public link</td></tr>
              <tr><td style="padding:6px 0;color:#222;font-size:14px;line-height:1.5;border-top:1px solid #eee;"><span style="color:#22c55e;font-weight:800;margin-right:10px;">&#10003;</span>No logins, no subscriptions &mdash; direct Google Drive access</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- CTA BUTTON -->
  <tr>
    <td style="background:#fff;padding:4px 36px 28px;text-align:center;">
      <a href="https://drive.google.com/drive/folders/${folderId}"
         style="display:block;background:#E8440A;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:17px 28px;border-radius:8px;letter-spacing:0.3px;">
        Open My Projects in Drive &nbsp;&rarr;
      </a>
      <p style="margin:10px 0 0;color:#aaa;font-size:12px;">
        Sign in with <strong style="color:#666;">${customerEmail}</strong> if Google prompts you
      </p>
    </td>
  </tr>

  <!-- ORDER DETAILS -->
  <tr>
    <td style="background:#fff;padding:0 36px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;border-radius:8px;overflow:hidden;">
        <tr>
          <td colspan="2" style="padding:10px 18px 6px;">
            <span style="font-size:10px;font-weight:700;color:#aaa;letter-spacing:1.2px;text-transform:uppercase;">Order Receipt</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 18px;font-size:13px;color:#999;width:38%;border-top:1px solid #eee;">Email</td>
          <td style="padding:8px 18px;font-size:13px;color:#222;font-weight:600;word-break:break-all;border-top:1px solid #eee;">${customerEmail}</td>
        </tr>
        <tr style="background:#f0f0f0;">
          <td style="padding:8px 18px;font-size:13px;color:#999;border-top:1px solid #e8e8e8;">Payment ID</td>
          <td style="padding:8px 18px;font-size:12px;color:#444;font-family:'Courier New',Courier,monospace;word-break:break-all;border-top:1px solid #e8e8e8;">${paymentId}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- SECURITY NOTE -->
  <tr>
    <td style="background:#fff;padding:0 36px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-left:3px solid #E8440A;padding:8px 14px;font-size:12px;color:#888;line-height:1.7;">
            <strong style="color:#555;">&#128274; Keep this private:</strong> This Drive folder is shared exclusively with your email.
            Do not forward this email — others cannot access your files without being individually granted permission.
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#f8f8f8;border-top:1px solid #eee;padding:20px 36px 24px;text-align:center;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 5px;font-size:13px;font-weight:700;color:#333;">Code Hunters</p>
      <p style="margin:0 0 8px;font-size:12px;color:#aaa;">
        Questions? <a href="mailto:support@codehunters.dev" style="color:#E8440A;text-decoration:none;">support@codehunters.dev</a>
      </p>
      <p style="margin:0;font-size:11px;color:#ccc;">
        Transactional email &mdash; sent to confirm your purchase &nbsp;&middot;&nbsp;
        &copy; 2026 Code Hunters &nbsp;&middot;&nbsp;
        <a href="https://codehunters.dev" style="color:#ccc;text-decoration:none;">codehunters.dev</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`,
    });
  }
}

// --- Middleware ---
// Webhook needs raw body for HMAC — mount BEFORE express.json()
app.use('/api/razorpay-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---

// Config for frontend
app.get('/api/config', (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const configured = keyId && !keyId.includes('REPLACE');
  res.json({
    razorpayConfigured: configured,
    keyId: configured ? keyId : null,
    products: Object.values(PRODUCTS),
  });
});

// Get all products
app.get('/api/products', (req, res) => {
  res.json(Object.values(PRODUCTS));
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = PRODUCTS[req.params.id];
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Create Razorpay Order
app.post('/api/create-razorpay-order', async (req, res) => {
  const razorpay = getRazorpay();
  if (!razorpay) {
    return res.status(503).json({
      error: 'Razorpay not configured',
      message: 'Add your Razorpay API keys to the .env file. Get them at https://dashboard.razorpay.com/app/keys'
    });
  }

  const { items, customerName, customerEmail, customerPhone } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in cart' });
  }

  // Calculate total amount in paise
  let totalPaise = 0;
  const validItems = [];
  for (const item of items) {
    const product = PRODUCTS[item.id];
    if (!product) continue;
    const qty = item.quantity || 1;
    totalPaise += product.price * 100 * qty;
    validItems.push({ name: product.name, qty });
  }

  if (!validItems.length) {
    return res.status(400).json({ error: 'No valid products found' });
  }

  try {
    const orderKey = generateOrderKey();
    const orderNumber = getNextOrderNumber();
    const order = await razorpay.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: orderKey,
      notes: {
        order_key: orderKey,
        order_number: String(orderNumber),
        customer_name: customerName || '',
        customer_email: customerEmail || '',
        customer_phone: customerPhone || '',
        items: validItems.map(i => i.name).join(', '),
      },
    });

    res.json({
      orderId: order.id,
      orderKey: orderKey,
      orderNumber: orderNumber,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Verify payment signature (HMAC-SHA256) + grant Drive access
app.post('/api/verify-payment', async (req, res) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || keySecret.includes('REPLACE')) {
    return res.status(503).json({ error: 'Razorpay not configured' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');

  const verified = expectedSignature === razorpay_signature;

  if (verified) {
    // Fetch order notes from Razorpay to get customer email, then grant Drive access
    try {
      const razorpay = getRazorpay();
      if (razorpay) {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        const customerEmail = order.notes && order.notes.customer_email;
        if (customerEmail) {
          await grantAccess(customerEmail, razorpay_payment_id);
        }
      }
    } catch (err) {
      // Do NOT fail the response — payment is confirmed; webhook is the safety net
      console.error('Access grant error (verify-payment):', err.message);
    }
  }

  res.json({ verified });
});

// Razorpay Webhook — belt-and-suspenders delivery for network drops / browser closes
app.post('/api/razorpay-webhook', async (req, res) => {
  const sig = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: 'Webhook not configured' });

  const expectedSig = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
  if (sig !== expectedSig) return res.status(400).send('Invalid signature');

  let event;
  try { event = JSON.parse(req.body.toString()); } catch { return res.status(400).send('Bad JSON'); }

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    try {
      const razorpay = getRazorpay();
      if (razorpay) {
        const order = await razorpay.orders.fetch(payment.order_id);
        const customerEmail = order.notes && order.notes.customer_email;
        if (customerEmail) {
          await grantAccess(customerEmail, payment.id);
        }
      }
    } catch (err) {
      console.error('Access grant error (webhook):', err.message);
    }
  }

  res.json({ received: true });
});

// --- Page routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});
app.get('/cart.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'cart.html'));
});

// Legacy 301 redirects – covers all /sp and /sp/* paths
app.get('/sp', (req, res) => res.redirect(301, '/'));
app.get('/sp/*', (req, res) => res.redirect(301, '/'));

// --- Static files ---
app.use('/PAyment_gate', express.static(path.join(__dirname, 'PAyment_gate')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(__dirname));

// Export app for Vercel serverless runtime
module.exports = app;

// Start local server only when run directly (not imported by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  ====================================`);
    console.log(`  Code Hunters - Local Store`);
    console.log(`  ====================================`);
    console.log(`  Server running at: http://localhost:${PORT}`);
    console.log(`  Landing page:      http://localhost:${PORT}/`);
    console.log(`  Checkout:          http://localhost:${PORT}/checkout.html`);
    console.log(`  Shop:              http://localhost:${PORT}/PAyment_gate/shop.html`);
    console.log(`  ====================================\n`);

    const rz = getRazorpay();
    if (!rz) {
      console.log('  !! Razorpay NOT configured - payments disabled');
      console.log('  -> Add your API keys to .env file');
      console.log('  -> Get keys at: https://dashboard.razorpay.com/app/keys\n');
    } else {
      console.log('  Razorpay configured - payments ready\n');
    }
  });
}
