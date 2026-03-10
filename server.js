require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Product catalog (prices from actual product pages) ---
const PRODUCTS = {
  'developers-kit': {
    id: 'developers-kit',
    name: "Developer's Kit – 700+ Job-Ready Projects Bundle",
    price: 881,
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

// --- Razorpay instance (lazy, only if keys configured) ---
function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || keyId.includes('REPLACE') || !keySecret || keySecret.includes('REPLACE')) {
    return null;
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// --- Middleware ---
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
    const order = await razorpay.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: 'order_' + Date.now(),
      notes: {
        customer_name: customerName || '',
        customer_email: customerEmail || '',
        customer_phone: customerPhone || '',
        items: validItems.map(i => i.name).join(', '),
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Verify payment signature (HMAC-SHA256)
app.post('/api/verify-payment', (req, res) => {
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
  res.json({ verified });
});

// --- Page routes ---
app.get('/', (req, res) => {
  res.redirect('/sp/developers-kit.html');
});

// --- Static files ---
app.use('/PAyment_gate', express.static(path.join(__dirname, 'PAyment_gate')));
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`\n  ====================================`);
  console.log(`  Code Hunters - Local Store`);
  console.log(`  ====================================`);
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log(`  Landing page:      http://localhost:${PORT}/sp/developers-kit.html`);
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
