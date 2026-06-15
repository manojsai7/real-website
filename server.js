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
  // --- Root Bundles ---
  'ai_bundle': {
    id: 'ai_bundle',
    name: 'AI Engineer Bundle',
    price: 399,
    currency: 'INR',
    description: '150+ Machine Learning Resources, Deep Learning Projects, and NLP Toolkit with lifetime access',
    folderEnv: 'GDRIVE_FOLDER_AI'
  },
  'python_bundle': {
    id: 'python_bundle',
    name: 'Python Developer Bundle',
    price: 299,
    currency: 'INR',
    description: '200+ Python Project Source Codes, Django Full Stack, and ML implementations',
    folderEnv: 'GDRIVE_FOLDER_PYTHON'
  },
  'web_bundle': {
    id: 'web_bundle',
    name: 'Full Stack Web Bundle',
    price: 299,
    currency: 'INR',
    description: 'HTML/CSS/JS, React Frontend Projects, PHP Backend, and UI Templates',
    folderEnv: 'GDRIVE_FOLDER_WEB'
  },
  'programming_bundle': {
    id: 'programming_bundle',
    name: 'Programming Master Bundle',
    price: 199,
    currency: 'INR',
    description: 'Java, C/C++, C# Projects with DSA Resources and Programming Roadmaps',
    folderEnv: 'GDRIVE_FOLDER_PROGRAMMING'
  },
  'career_bundle': {
    id: 'career_bundle',
    name: 'Career Accelerator Bundle',
    price: 99,
    currency: 'INR',
    description: 'Resume Templates, Interview Prep, Productivity Tools, and Career Growth Guides',
    folderEnv: 'GDRIVE_FOLDER_CAREER'
  },
  'mega_bundle': {
    id: 'mega_bundle',
    name: 'Ultimate Mega Bundle',
    price: 599,
    currency: 'INR',
    description: 'Everything on the platform – all bundles, projects, roadmaps, and resources with lifetime access',
    folderEnv: 'GDRIVE_FOLDER_MEGA'
    // can be deleted from here vro
  },

  // --- WooCommerce Sub-site Products ---
  'developers-kit': {
    id: 'developers-kit',
    name: "Developer's Kit \u2013 700+ Projects Bundle",
    price: 1,
    currency: 'INR',
    description: "700+ real-world projects across 10+ technologies with lifetime access & updates"
  },
  '30-day-data-analyst-kit': {
    id: '30-day-data-analyst-kit',
    name: '30-Day Data Analyst Kit',
    price: 1,
    currency: 'INR',
    description: '30-day structured plan, real datasets, portfolio projects'
  },
  '5-day-js-bootcamp': {
    id: '5-day-js-bootcamp',
    name: '5-Day JavaScript Bootcamp',
    price: 1,
    currency: 'INR',
    description: '5-day intensive training, hands-on projects, modern JS (ES6+)'
  },
  'interview-mastery': {
    id: 'interview-mastery',
    name: 'Interview Mastery System',
    price: 1,
    currency: 'INR',
    description: 'Cover every interview round, HR + Technical prep, mock interview guides'
  },
  'interview-cracking-2026': {
    id: 'interview-cracking-2026',
    name: 'Interview-Cracking System (2026 AI)',
    price: 1,
    currency: 'INR',
    description: 'AI-powered preparation, 2026 updated questions, industry focused'
  },
  'Testing-First': {
    id: 'Testing-First',
    name: 'Testing First',
    price: 1,
    currency: 'INR',
    description: 'Cover every Test, HR + Technical prep, mock interview guides'
  },
  'ats-resume-template': {
    id: 'ats-resume-template',
    name: 'ATS Resume Template - WebDev',
    price: 1,
    currency: 'INR',
    description: 'ATS-approved format, web developer focused, editable template'
  },
  'vip-pass': {
    id: 'vip-pass',
    name: 'Upgrade to VIP Pass',
    price: 1,
    currency: 'INR',
    description: 'Exclusive VIP content, early access to courses, priority support'
  }
};

const FOLDER_ENV_ALIASES = {
  GDRIVE_FOLDER_AI: ['GDRIVE_FOLDER_AI_BUNDLE', 'GDRIVE_FOLDER_AIBUNDLE', 'GDRIVE_FOLDER_AI_ENGINEER'],
};

const COUPONS = {
  RBY00: {
    code: 'RBY00',
    discountPercent: 99,
  },
};

function getConfiguredFolderId(folderEnv) {
  const keys = [folderEnv].concat(FOLDER_ENV_ALIASES[folderEnv] || []);
  for (const key of keys) {
    const value = process.env[key];
    if (!value) continue;
    const normalized = value.replace(/\0/g, '').trim();
    if (!normalized || /^your_.*folder_id$/i.test(normalized) || normalized.includes('REPLACE')) continue;
    return normalized;
  }
  return null;
}

function getCoupon(code) {
  if (!code) return null;
  return COUPONS[String(code).trim().toUpperCase()] || null;
}

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
const processedPayments = new Set();

// Resend is initialised lazily so a missing key at cold-start doesn't crash the module
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key || key.includes('your_api_key_here') || key.includes('REPLACE')) return null;
  return new Resend(key);
}

function getDriveClient() {
  let creds;
  try {
    creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON: ' + e.message);
  }
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

function getPurchasedProducts(productIds) {
  const ids = Array.isArray(productIds) ? productIds : [];
  return ids
    .map(id => PRODUCTS[id])
    .filter(product => product && product.folderEnv);
}

function parseProductIdsFromNotes(notes) {
  if (!notes || !notes.product_ids) return [];
  try {
    const parsed = JSON.parse(notes.product_ids);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(notes.product_ids).split(',').map(id => id.trim()).filter(Boolean);
  }
}

async function grantAccess(customerEmail, paymentId, productIds = []) {
  if (processedPayments.has(paymentId)) {
    console.log('[delivery] Payment already processed:', paymentId);
    return;
  }
  processedPayments.add(paymentId);

  const purchasedProducts = getPurchasedProducts(productIds);
  const folders = purchasedProducts
    .map(product => ({
      product,
      folderId: getConfiguredFolderId(product.folderEnv),
    }))
    .filter(entry => entry.folderId);
  const legacyFolderId = getConfiguredFolderId('GDRIVE_FOLDER_ID');
  if (!folders.length && legacyFolderId) {
    folders.push({
      product: { name: 'Code Hunters Bundle', folderEnv: 'GDRIVE_FOLDER_ID' },
      folderId: legacyFolderId,
    });
  }

  const hasDriveConfig = Boolean(folders.length && process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (!hasDriveConfig) {
    console.warn('[delivery] Drive not configured — GDRIVE_FOLDER_ID or GOOGLE_SERVICE_ACCOUNT_JSON missing');
  }

  // --- Share Google Drive folders ---
  let isDuplicate = false;
  const grantedFolders = [];
  if (hasDriveConfig) {
    try {
      const drive = getDriveClient();
      for (const entry of folders) {
        try {
          await drive.permissions.create({
            fileId: entry.folderId,
            requestBody: { type: 'user', role: 'reader', emailAddress: customerEmail },
            sendNotificationEmail: false,
            fields: 'id',
          });
          grantedFolders.push(entry);
          console.log('[delivery] Drive access granted to', customerEmail, 'for', entry.product.name, entry.folderId);
        } catch (err) {
          const duplicateGrant = err && (err.code === 409 || /already/i.test(err.message || ''));
          if (duplicateGrant) {
            grantedFolders.push(entry);
            console.warn('[delivery] Drive access already exists for', customerEmail, 'on', entry.product.name);
          } else {
            console.error('[delivery] Drive grant FAILED for', customerEmail, 'on', entry.product.name, '-', err.message);
          }
        }
      }
    } catch (err) {
      const duplicateGrant = err && (err.code === 409 || /already/i.test(err.message || ''));
      if (duplicateGrant) {
        isDuplicate = true;
        console.warn('[delivery] Drive access already exists for', customerEmail, '— skipping duplicate email');
      } else {
        console.error('[delivery] Drive grant FAILED for', customerEmail, '—', err.message);
      }
    }
  }

  if (isDuplicate) return;

  // --- Send confirmation email ---
  const resend = getResend();
  if (!resend) {
    console.warn('[delivery] RESEND_API_KEY not set — skipping confirmation email');
    return;
  }
  const accessUrl = hasDriveConfig && grantedFolders.length ? `https://drive.google.com/drive/folders/${grantedFolders[0].folderId}` : 'https://codehunters.dev';
  const accessRows = grantedFolders.length
    ? grantedFolders.map((entry, index) => `
              <tr>
                <td style="padding:${index === 0 ? '0 0 10px' : '10px 0'};border-top:${index === 0 ? 'none' : '1px solid #eee'};">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#222;font-size:14px;line-height:1.5;font-weight:700;">
                        <span style="color:#22c55e;font-weight:800;margin-right:10px;">&#10003;</span>${entry.product.name}
                      </td>
                      <td align="right" style="white-space:nowrap;">
                        <a href="https://drive.google.com/drive/folders/${entry.folderId}" style="display:inline-block;background:#E8440A;color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:7px 12px;border-radius:6px;">Open Drive</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')
    : `
              <tr>
                <td style="padding:6px 0;color:#222;font-size:14px;line-height:1.5;">
                  <span style="color:#22c55e;font-weight:800;margin-right:10px;">&#10003;</span>Your purchased bundle access is being processed
                </td>
              </tr>`;
  const primaryCtaLabel = grantedFolders.length > 1 ? 'Open First Purchased Bundle' : 'Open My Projects in Drive';
  const accessHelpText = hasDriveConfig
    ? `Sign in with <strong style="color:#666;">${customerEmail}</strong> if Google prompts you`
    : 'Drive delivery is being processed. If access is delayed, contact <strong style="color:#666;">aohacx@gmail.com</strong>.';
  try {
    const sendResult = await resend.emails.send({
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
              ${accessRows}
              <tr><td style="padding:10px 0 6px;color:#222;font-size:14px;line-height:1.5;border-top:1px solid #eee;"><span style="color:#22c55e;font-weight:800;margin-right:10px;">&#10003;</span>Private Google Drive access for every purchased bundle</td></tr>
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
      <a href="${accessUrl}"
         style="display:block;background:#E8440A;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:17px 28px;border-radius:8px;letter-spacing:0.3px;">
        ${primaryCtaLabel} &nbsp;&rarr;
      </a>
      <p style="margin:10px 0 0;color:#aaa;font-size:12px;">
        ${accessHelpText}
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
        Questions? <a href="mailto:aohacx@gmail.com" style="color:#E8440A;text-decoration:none;">aohacx@gmail.com</a>
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
    if (sendResult && sendResult.error) {
      throw new Error(sendResult.error.message || 'Unknown Resend API error');
    }
    console.log('[delivery] Confirmation email sent to', customerEmail, 'id=', sendResult?.data?.id || sendResult?.id || 'n/a');
  } catch (err) {
    // Email failure is non-fatal — Drive access is already granted
    console.error('[delivery] Resend email FAILED for', customerEmail, '—', err.message);
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

  const { items, customerName, customerEmail, customerPhone, couponCode } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in cart' });
  }

  // Calculate total amount in paise. Coupon validation stays server-side.
  let subtotalPaise = 0;
  const validItems = [];
  for (const item of items) {
    const product = PRODUCTS[item.id];
    if (!product) continue;
    const qty = product.type === 'bundle'
      ? 1
      : Math.max(1, Math.min(10, parseInt(item.quantity, 10) || 1));
    subtotalPaise += product.price * 100 * qty;
    validItems.push({ id: product.id, name: product.name, qty });
  }

  if (!validItems.length) {
    return res.status(400).json({ error: 'No valid products found' });
  }

  const coupon = getCoupon(couponCode);
  const discountPaise = coupon
    ? Math.floor(subtotalPaise * coupon.discountPercent / 100)
    : 0;
  const totalPaise = Math.max(100, subtotalPaise - discountPaise);

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
        product_ids: JSON.stringify(validItems.map(i => i.id)),
        coupon_code: coupon ? coupon.code : '',
        coupon_discount_percent: coupon ? String(coupon.discountPercent) : '',
        subtotal_paise: String(subtotalPaise),
        discount_paise: String(discountPaise),
      },
    });

    res.json({
      orderId: order.id,
      orderKey: orderKey,
      orderNumber: orderNumber,
      amount: order.amount,
      subtotal: subtotalPaise,
      discount: discountPaise,
      coupon: coupon ? { code: coupon.code, discountPercent: coupon.discountPercent } : null,
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

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = Buffer.from(String(razorpay_signature), 'hex');
  const verified = expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  let customerEmail = null;
  let purchasedProducts = [];

  if (verified) {
    // Fetch order notes from Razorpay to get customer email, then grant Drive access
    try {
      const razorpay = getRazorpay();
      if (razorpay) {
        const order = await razorpay.orders.fetch(razorpay_order_id);
        customerEmail = order.notes && order.notes.customer_email;
        purchasedProducts = parseProductIdsFromNotes(order.notes)
          .map(id => PRODUCTS[id])
          .filter(Boolean)
          .map(product => ({ id: product.id, name: product.name }));
        if (customerEmail) {
          await grantAccess(customerEmail, razorpay_payment_id, parseProductIdsFromNotes(order.notes));
        }
      }
    } catch (err) {
      // Do NOT fail the response — payment is confirmed; webhook is the safety net
      console.error('Access grant error (verify-payment):', err.message);
    }
  }

  res.json({ verified, email: customerEmail || null, products: purchasedProducts });
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
          await grantAccess(customerEmail, payment.id, parseProductIdsFromNotes(order.notes));
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
