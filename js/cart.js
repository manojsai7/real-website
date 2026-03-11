/* ============================================================
   Code Hunters — Shared Cart Module (localStorage)
   Include this script on any page to get:
     • Cart data API (add, remove, update, get, totals)
     • Auto-injected slide-in drawer (right side)
     • Navbar badge auto-update
   ============================================================ */

const CartModule = (() => {
  const STORAGE_KEY = 'codehunters_cart';

  /* ---------- helpers ---------- */
  function _read() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }
  function _write(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    _updateBadge();
    _renderDrawer();
    document.dispatchEvent(new CustomEvent('cart:changed', { detail: getCart() }));
  }

  /* ---------- public API ---------- */
  function getCart()       { return _read(); }
  function getCartCount()  { return _read().reduce((s, i) => s + i.quantity, 0); }
  function getCartTotal()  { return _read().reduce((s, i) => s + i.price * i.quantity, 0); }

  function addToCart(product) {
    // product = { id, name, price, image (optional) }
    const cart = _read();
    const idx = cart.findIndex(i => i.id === product.id);
    if (idx >= 0) {
      cart[idx].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    _write(cart);
    openDrawer();
  }

  function removeFromCart(id) {
    _write(_read().filter(i => i.id !== id));
  }

  function updateQuantity(id, qty) {
    const cart = _read();
    const idx = cart.findIndex(i => i.id === id);
    if (idx < 0) return;
    if (qty <= 0) { cart.splice(idx, 1); }
    else { cart[idx].quantity = qty; }
    _write(cart);
  }

  function clearCart() { _write([]); }

  /* ---------- badge ---------- */
  function _updateBadge() {
    document.querySelectorAll('.cart-badge').forEach(el => {
      const c = getCartCount();
      el.textContent = c;
      el.style.display = c > 0 ? 'flex' : 'none';
    });
  }

  /* ---------- drawer DOM ---------- */
  let drawerInjected = false;

  function _injectDrawer() {
    if (drawerInjected) return;
    drawerInjected = true;

    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.addEventListener('click', closeDrawer);

    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.innerHTML = `
      <div class="cd-header">
        <h3>Your Cart</h3>
        <button id="cd-close" aria-label="Close cart">&times;</button>
      </div>
      <div class="cd-items" id="cd-items"></div>
      <div class="cd-footer" id="cd-footer"></div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    document.getElementById('cd-close').addEventListener('click', closeDrawer);

    // inject styles once
    if (!document.getElementById('cart-drawer-styles')) {
      const s = document.createElement('style');
      s.id = 'cart-drawer-styles';
      s.textContent = `
        #cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;opacity:0;pointer-events:none;transition:opacity .3s}
        #cart-overlay.open{opacity:1;pointer-events:auto}
        #cart-drawer{position:fixed;top:0;right:-420px;width:400px;max-width:92vw;height:100%;background:#fff;z-index:9999;display:flex;flex-direction:column;box-shadow:-4px 0 24px rgba(0,0,0,.15);transition:right .35s cubic-bezier(.4,0,.2,1)}
        #cart-drawer.open{right:0}
        .cd-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #eee}
        .cd-header h3{font-size:20px;font-weight:700;color:#222;margin:0}
        #cd-close{background:none;border:none;font-size:28px;cursor:pointer;color:#666;line-height:1}
        #cd-close:hover{color:#d50000}
        .cd-items{flex:1;overflow-y:auto;padding:16px 24px}
        .cd-empty{text-align:center;padding:60px 0;color:#999}
        .cd-item{display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #f3f3f3}
        .cd-item img{width:56px;height:56px;object-fit:cover;border-radius:6px;background:#f5f5f5}
        .cd-item-info{flex:1;min-width:0}
        .cd-item-name{font-size:14px;font-weight:600;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .cd-item-price{font-size:13px;color:#666;margin-top:2px}
        .cd-qty{display:flex;align-items:center;gap:0;border:1px solid #ddd;border-radius:6px;overflow:hidden}
        .cd-qty button{width:30px;height:30px;background:#f9f9f9;border:none;font-size:16px;cursor:pointer;color:#333;transition:background .15s}
        .cd-qty button:hover{background:#eee}
        .cd-qty span{width:30px;text-align:center;font-size:13px;font-weight:600}
        .cd-item-rm{background:none;border:none;color:#ccc;font-size:18px;cursor:pointer;padding:4px;transition:color .15s}
        .cd-item-rm:hover{color:#d50000}
        .cd-footer{padding:20px 24px;border-top:1px solid #eee}
        .cd-subtotal{display:flex;justify-content:space-between;font-size:17px;font-weight:700;color:#222;margin-bottom:16px}
        .cd-subtotal .amt{color:#22c55e}
        .cd-actions{display:flex;flex-direction:column;gap:10px}
        .cd-btn{display:block;text-align:center;padding:13px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;transition:background .2s,transform .15s,box-shadow .2s;border:none}
        .cd-btn:hover{transform:translateY(-1px);text-decoration:none}
        .cd-btn-primary{background:#F66711;color:#fff}
        .cd-btn-primary:hover{background:#cf4e01;box-shadow:0 4px 16px rgba(246,103,17,.3)}
        .cd-btn-secondary{background:#f5f5f5;color:#333}
        .cd-btn-secondary:hover{background:#eaeaea}
      `;
      document.head.appendChild(s);
    }
  }

  function _renderDrawer() {
    const itemsEl = document.getElementById('cd-items');
    const footerEl = document.getElementById('cd-footer');
    if (!itemsEl) return;

    const cart = _read();

    if (!cart.length) {
      itemsEl.innerHTML = '<div class="cd-empty"><p>Your cart is empty</p></div>';
      footerEl.innerHTML = '';
      return;
    }

    itemsEl.innerHTML = cart.map(item => `
      <div class="cd-item" data-id="${item.id}">
        ${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<div style="width:56px;height:56px;border-radius:6px;background:linear-gradient(135deg,#F66711,#ff9a56);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px">${item.name.charAt(0)}</div>`}
        <div class="cd-item-info">
          <div class="cd-item-name">${item.name}</div>
          <div class="cd-item-price">₹${item.price} × ${item.quantity}</div>
        </div>
        <div class="cd-qty">
          <button data-action="dec" data-id="${item.id}">−</button>
          <span>${item.quantity}</span>
          <button data-action="inc" data-id="${item.id}">+</button>
        </div>
        <button class="cd-item-rm" data-action="rm" data-id="${item.id}">✕</button>
      </div>
    `).join('');

    footerEl.innerHTML = `
      <div class="cd-subtotal"><span>Subtotal</span><span class="amt">₹${getCartTotal()}</span></div>
      <div class="cd-actions">
        <a href="/checkout.html" class="cd-btn cd-btn-primary">Checkout</a>
        <a href="/cart" class="cd-btn cd-btn-secondary">View Full Cart</a>
      </div>
    `;

    // Attach event listeners
    itemsEl.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const action = e.currentTarget.dataset.action;
        const cart = _read();
        const item = cart.find(i => i.id === id);
        if (!item) return;
        if (action === 'inc') updateQuantity(id, item.quantity + 1);
        else if (action === 'dec') updateQuantity(id, item.quantity - 1);
        else if (action === 'rm') removeFromCart(id);
      });
    });
  }

  /* ---------- open / close ---------- */
  function openDrawer() {
    _injectDrawer();
    requestAnimationFrame(() => {
      document.getElementById('cart-overlay').classList.add('open');
      document.getElementById('cart-drawer').classList.add('open');
      document.body.style.overflow = 'hidden';
    });
    _renderDrawer();
  }

  function closeDrawer() {
    const overlay = document.getElementById('cart-overlay');
    const drawer  = document.getElementById('cart-drawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer)  drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---------- init ---------- */
  function init() {
    _injectDrawer();
    _updateBadge();
    // Listen for cart-open clicks
    document.addEventListener('click', e => {
      if (e.target.closest('.cart-trigger')) { e.preventDefault(); openDrawer(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { getCart, getCartCount, getCartTotal, addToCart, removeFromCart, updateQuantity, clearCart, openDrawer, closeDrawer };
})();
