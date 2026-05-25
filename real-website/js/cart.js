// js/cart.js — Code Hunters guest cart
// Storage: sessionStorage, key: ch_cart
// Schema: { id, title, price, type: "bundle"|"product", quantity }
var CartModule = (function () {
  var KEY = 'ch_cart';

  function _read() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }

  function _write(cart) {
    sessionStorage.setItem(KEY, JSON.stringify(cart));
    _updateBadge(cart);
    _renderDrawer(cart);
    window.dispatchEvent(new CustomEvent('cart:changed', { detail: { cart: cart } }));
  }

  function getCart() { return _read(); }

  function getCartCount() {
    return _read().reduce(function (s, i) { return s + (i.quantity || 1); }, 0);
  }

  function getCartTotal() {
    return _read().reduce(function (s, i) { return s + (i.price || 0) * (i.quantity || 1); }, 0);
  }

  function addToCart(item) {
    // item: { id, title, price, type, quantity? }
    var cart = _read();
    var existing = cart.find(function (i) { return i.id === item.id; });
    if (item.type === 'bundle') {
      if (!existing) {
        cart.push({ id: item.id, title: item.title, price: Number(item.price), type: 'bundle', quantity: 1 });
      }
      // bundles: silently ignore duplicate adds
    } else {
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        cart.push({ id: item.id, title: item.title, price: Number(item.price), type: item.type || 'product', quantity: item.quantity || 1 });
      }
    }
    _write(cart);
  }

  function removeFromCart(id) {
    _write(_read().filter(function (i) { return i.id !== id; }));
  }

  function updateQuantity(id, qty) {
    var cart = _read();
    var item = cart.find(function (i) { return i.id === id; });
    if (!item || item.type === 'bundle') return;
    if (qty < 1) { removeFromCart(id); return; }
    item.quantity = qty;
    _write(cart);
  }

  function clearCart() { _write([]); }

  // --- Badge ---
  function _updateBadge(cart) {
    var count = cart.reduce(function (s, i) { return s + (i.quantity || 1); }, 0);
    document.querySelectorAll('[data-cart-badge]').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
      if (count > 0) {
        el.classList.remove('badge-pop');
        void el.offsetWidth;
        el.classList.add('badge-pop');
      }
    });
  }

  // --- Drawer ---
  function _injectDrawer() {
    if (document.getElementById('ch-cart-drawer')) return;

    var style = document.createElement('style');
    style.id = 'ch-cart-drawer-css';
    style.textContent = [
      '#ch-cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998;opacity:0;pointer-events:none;transition:opacity .25s}',
      '#ch-cart-overlay.open{opacity:1;pointer-events:auto}',
      '#ch-cart-drawer{position:fixed;top:0;right:0;bottom:0;width:420px;max-width:100vw;background:#fff;z-index:9999;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;box-shadow:-6px 0 40px rgba(0,0,0,.14);font-family:"Plus Jakarta Sans",system-ui,sans-serif}',
      '#ch-cart-drawer.open{transform:translateX(0)}',
      '@media(max-width:500px){#ch-cart-drawer{width:100vw}}',
      '.ch-dh{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid rgba(0,0,0,.08)}',
      '.ch-dh h2{font-size:18px;font-weight:700;color:#18181A;margin:0;letter-spacing:-.3px}',
      '.ch-dclose{background:none;border:none;font-size:24px;cursor:pointer;color:#706F6B;padding:2px 6px;line-height:1;border-radius:6px;transition:background .15s,color .15s}',
      '.ch-dclose:hover{color:#18181A;background:#f0f0ef}',
      '.ch-db{flex:1;overflow-y:auto;padding:16px 24px}',
      '.ch-empty{text-align:center;padding:48px 0 32px;color:#706F6B}',
      '.ch-empty-icon{font-size:52px;margin-bottom:16px}',
      '.ch-empty p{font-size:15px;font-weight:600;color:#18181A;margin:0 0 6px}',
      '.ch-empty span{font-size:14px;color:#706F6B}',
      '.ch-di{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.07)}',
      '.ch-di:last-child{border-bottom:none}',
      '.ch-di-icon{width:44px;height:44px;background:#FEF0EB;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}',
      '.ch-di-info{flex:1;min-width:0}',
      '.ch-di-title{font-size:14px;font-weight:600;color:#18181A;line-height:1.3;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ch-di-price{font-size:14px;font-weight:700;color:#E8440A;margin-bottom:6px}',
      '.ch-di-ctrl{display:flex;align-items:center;gap:8px}',
      '.ch-di-qty{display:flex;align-items:center;border:1px solid rgba(0,0,0,.14);border-radius:6px;overflow:hidden}',
      '.ch-di-qty button{background:none;border:none;width:28px;height:28px;font-size:15px;cursor:pointer;color:#18181A;display:flex;align-items:center;justify-content:center;transition:background .12s}',
      '.ch-di-qty button:hover{background:#f0f0ef}',
      '.ch-di-qty span{font-size:13px;font-weight:700;color:#18181A;min-width:22px;text-align:center;padding:0 2px}',
      '.ch-di-rm{background:none;border:none;cursor:pointer;color:#ADADAB;font-size:16px;padding:4px;border-radius:4px;line-height:1;transition:color .12s,background .12s;flex-shrink:0;margin-top:2px}',
      '.ch-di-rm:hover{color:#d50000;background:#fff5f5}',
      '.ch-df{padding:16px 24px;border-top:1px solid rgba(0,0,0,.08)}',
      '.ch-subtotal{display:flex;justify-content:space-between;align-items:baseline;font-size:16px;font-weight:700;color:#18181A;margin-bottom:14px}',
      '.ch-subtotal-val{color:#E8440A;font-size:20px;font-weight:800}',
      '.ch-da{display:flex;flex-direction:column;gap:10px}',
      '.ch-btn-co{display:block;width:100%;padding:14px;background:#E8440A;color:#fff;font-size:15px;font-weight:700;text-align:center;border:none;border-radius:8px;cursor:pointer;text-decoration:none;transition:background .15s,transform .1s}',
      '.ch-btn-co:hover{background:#CC3500;transform:translateY(-1px)}',
      '.ch-btn-vc{display:block;width:100%;padding:11px;background:#fff;color:#18181A;font-size:14px;font-weight:600;text-align:center;border:1.5px solid rgba(0,0,0,.14);border-radius:8px;cursor:pointer;text-decoration:none;transition:border-color .15s}',
      '.ch-btn-vc:hover{border-color:#18181A}',
      '@keyframes badge-pop{0%,100%{transform:scale(1)}50%{transform:scale(1.45)}}',
      '[data-cart-badge].badge-pop{animation:badge-pop .3s ease}'
    ].join('');
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.id = 'ch-cart-overlay';
    overlay.addEventListener('click', closeDrawer);
    document.body.appendChild(overlay);

    var drawer = document.createElement('div');
    drawer.id = 'ch-cart-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Shopping cart');
    drawer.innerHTML =
      '<div class="ch-dh">' +
        '<h2>Cart <span id="ch-dcount" style="font-size:14px;font-weight:600;color:#706F6B"></span></h2>' +
        '<button class="ch-dclose" aria-label="Close cart">&times;</button>' +
      '</div>' +
      '<div class="ch-db" id="ch-db"></div>' +
      '<div id="ch-df" class="ch-df" style="display:none">' +
        '<div class="ch-subtotal"><span>Subtotal</span><span class="ch-subtotal-val" id="ch-dtotal">&#8377;0</span></div>' +
        '<div class="ch-da">' +
          '<a href="/checkout.html" class="ch-btn-co">Checkout &#8594;</a>' +
          '<a href="/cart.html" class="ch-btn-vc">View Cart</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(drawer);

    drawer.querySelector('.ch-dclose').addEventListener('click', closeDrawer);
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _renderDrawer(cart) {
    var body = document.getElementById('ch-db');
    var foot = document.getElementById('ch-df');
    var countEl = document.getElementById('ch-dcount');
    if (!body) return;

    var count = cart.reduce(function (s, i) { return s + (i.quantity || 1); }, 0);
    if (countEl) countEl.textContent = count > 0 ? '(' + count + ' item' + (count !== 1 ? 's' : '') + ')' : '';

    if (!cart.length) {
      body.innerHTML =
        '<div class="ch-empty">' +
          '<div class="ch-empty-icon">&#128722;</div>' +
          '<p>Your cart is empty</p>' +
          '<span>Browse our products and start adding!</span>' +
        '</div>';
      if (foot) foot.style.display = 'none';
      return;
    }

    var html = '';
    cart.forEach(function (item) {
      var icon = item.type === 'bundle' ? '&#128230;' : '&#128196;';
      var lineTotal = (item.price * (item.quantity || 1)).toLocaleString('en-IN');
      var isBundle = item.type === 'bundle';
      html +=
        '<div class="ch-di">' +
          '<div class="ch-di-icon">' + icon + '</div>' +
          '<div class="ch-di-info">' +
            '<div class="ch-di-title">' + _esc(item.title) + '</div>' +
            '<div class="ch-di-price">&#8377;' + lineTotal + '</div>' +
            '<div class="ch-di-ctrl">' +
              (isBundle
                ? '<span style="font-size:11px;color:#706F6B;background:#f3f3f3;padding:2px 8px;border-radius:4px">Bundle &#183; qty fixed</span>'
                : '<div class="ch-di-qty">' +
                    '<button data-ch-minus data-id="' + _esc(item.id) + '" aria-label="Decrease">&#8722;</button>' +
                    '<span>' + (item.quantity || 1) + '</span>' +
                    '<button data-ch-plus data-id="' + _esc(item.id) + '" aria-label="Increase">+</button>' +
                  '</div>'
              ) +
            '</div>' +
          '</div>' +
          '<button class="ch-di-rm" data-ch-rm data-id="' + _esc(item.id) + '" aria-label="Remove item">&#10005;</button>' +
        '</div>';
    });
    body.innerHTML = html;

    if (foot) {
      var subtotal = cart.reduce(function (s, i) { return s + i.price * (i.quantity || 1); }, 0);
      var totalEl = document.getElementById('ch-dtotal');
      if (totalEl) totalEl.textContent = '\u20B9' + subtotal.toLocaleString('en-IN');
      foot.style.display = 'block';
    }

    body.querySelectorAll('[data-ch-rm]').forEach(function (btn) {
      btn.addEventListener('click', function () { removeFromCart(this.dataset.id); });
    });
    body.querySelectorAll('[data-ch-plus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.id;
        var c = _read();
        var item = c.find(function (i) { return i.id === id; });
        if (item) updateQuantity(id, (item.quantity || 1) + 1);
      });
    });
    body.querySelectorAll('[data-ch-minus]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.dataset.id;
        var c = _read();
        var item = c.find(function (i) { return i.id === id; });
        if (item) updateQuantity(id, (item.quantity || 1) - 1);
      });
    });
  }

  function openDrawer() {
    _injectDrawer();
    _renderDrawer(_read());
    var overlay = document.getElementById('ch-cart-overlay');
    var drawer = document.getElementById('ch-cart-drawer');
    if (overlay) overlay.classList.add('open');
    if (drawer) drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    var overlay = document.getElementById('ch-cart-overlay');
    var drawer = document.getElementById('ch-cart-drawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer) drawer.classList.remove('open');
    document.body.style.overflow = '';
  }

  function _init() {
    _injectDrawer();
    _updateBadge(_read());
    document.querySelectorAll('[data-cart-open]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openDrawer(); });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

  return {
    getCart: getCart,
    getCartCount: getCartCount,
    getCartTotal: getCartTotal,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQuantity: updateQuantity,
    clearCart: clearCart,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer
  };
})();
