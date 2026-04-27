// Language system
const LANG_KEY = 'cmStrengthLanguage';
let currentLang = localStorage.getItem(LANG_KEY) || 'en';

function toggleLang() {
  currentLang = currentLang === 'en' ? 'ko' : 'en';
  localStorage.setItem(LANG_KEY, currentLang);
  applyLang();
  updateCalc();
  renderCart();
}

function applyLang() {
  document.documentElement.lang = currentLang === 'ko' ? 'ko' : 'en';
  const toggleLabel = currentLang === 'en' ? '한국어' : 'English';
  document.querySelectorAll('#langToggle, #mobileLangToggle').forEach(el => {
    el.textContent = toggleLabel;
  });

  document.querySelectorAll('[data-en]').forEach(el => {
    const txt = el.getAttribute('data-' + currentLang);
    if (txt) el.textContent = txt;
  });

  document.querySelectorAll('[data-placeholder-en]').forEach(el => {
    const txt = el.getAttribute('data-placeholder-' + currentLang);
    if (txt) el.setAttribute('placeholder', txt);
  });

  document.querySelectorAll('select option[data-en]').forEach(el => {
    const txt = el.getAttribute('data-' + currentLang);
    if (txt) el.textContent = txt;
  });
}

// Navigation
const SITE_ROOT = window.location.pathname.includes('/posts/') ? '../' : '';

function sitePath(path) {
  return SITE_ROOT + path;
}

const PAGE_ROUTES = {
  home: 'home.html',
  about: 'aboutme.html',
  coaching: 'coaching.html',
  programs: 'pdf-programs.html',
  blog: 'blog.html',
  cart: 'cart.html',
  intake: 'intake.html',
  payment: 'payment.html',
  inquire: 'contact.html'
};

const PAYMENT_PACKAGES = {
  'coaching-virtual': { label: 'Virtual Coaching', amount: '$150' },
  'coaching-body-profile': { label: 'Body Profile', amount: '$300' },
  'coaching-hybrid': { label: 'Hybrid Coaching', amount: '$450' },
  'coaching-s-tier': { label: 'S-Tier', amount: '$600' }
};

function currentPageName() {
  return document.body.dataset.page || document.querySelector('.page.active')?.id.replace('page-', '') || 'home';
}

function navigate(page) {
  const route = PAGE_ROUTES[page];
  if (route && !document.getElementById('page-' + page)) {
    window.location.href = sitePath(route);
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    document.body.dataset.page = page;
  }

  setActiveNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(triggerReveal, 100);
  renderCart();
}

function setActiveNav() {
  const current = currentPageName();
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.querySelectorAll(`.nav-links a[data-page-link="${current}"]`).forEach(a => a.classList.add('active'));
}

// Cart
const CART_KEY = 'cmStrengthCartItems';
const CONTACT_EMAIL = 'coach.cmstrength@gmail.com';

function parseWon(value) {
  return Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
}

function formatWon(value) {
  return 'KRW ' + Number(value || 0).toLocaleString('ko-KR');
}

function currencyForItem(item) {
  if (item.currency) return item.currency;
  if (item.type === 'Coaching' || item.type === 'PDF Program') return 'USD';
  return 'KRW';
}

function currencyFromPrice(price, type) {
  if (String(price || '').trim().startsWith('$') || type === 'Coaching' || type === 'PDF Program') return 'USD';
  return 'KRW';
}

function formatMoney(value, currency = 'KRW') {
  if (currency === 'USD') return '$' + Number(value || 0).toLocaleString('en-US');
  return formatWon(value);
}

function localizeCartType(type) {
  if (currentLang !== 'ko') return type || '';
  if (type === 'Coaching') return '코칭';
  if (type === 'PDF Program') return 'PDF 프로그램';
  return type || '';
}

function getCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    localStorage.setItem(CART_KEY, '[]');
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function addToCart(name, price, type, productKey, months) {
  if (type === 'PDF Program' && !productKey) {
    alert('This PDF is not configured for automatic delivery yet. Please choose the English PDF option.');
    return;
  }

  const items = getCart();
  const id = globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  items.push({
    id,
    name,
    price: parseWon(price),
    type,
    productKey: productKey || '',
    months: months ? Number(months) : undefined,
    currency: currencyFromPrice(price, type),
    purchased: false
  });
  saveCart(items);
  renderCart();
  if (currentPageName() !== 'cart') window.location.href = 'cart.html';
}

function removeFromCart(id) {
  saveCart(getCart().filter(item => String(item.id) !== String(id)));
  renderCart();
}

function renderCart() {
  const items = getCart();
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const currencies = new Set(items.map(currencyForItem));
  const cartCurrency = currencies.size === 1 ? Array.from(currencies)[0] : null;
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = items.length; });
  document.querySelectorAll('.cart-total').forEach(el => {
    el.textContent = cartCurrency ? formatMoney(total, cartCurrency) : (currentLang === 'ko' ? '혼합 통화' : 'Mixed currencies');
  });
  document.querySelectorAll('.cart-items').forEach(list => {
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('li');
      empty.textContent = currentLang === 'ko' ? '장바구니가 비어 있습니다.' : 'Your cart is empty.';
      list.appendChild(empty);
      return;
    }

    items.forEach(item => {
      const li = document.createElement('li');
      const details = document.createElement('div');
      const name = document.createElement('strong');
      const type = document.createElement('small');
      const actions = document.createElement('div');
      const price = document.createElement('span');
      const remove = document.createElement('button');
      const locked = item.type === 'PDF Program' ? document.createElement('span') : null;
      const itemCurrency = currencyForItem(item);
      name.textContent = item.name;
      type.textContent = localizeCartType(item.type);
      price.textContent = formatMoney(item.price, itemCurrency);
      if (locked) {
        locked.className = 'cart-locked';
        locked.textContent = currentLang === 'ko' ? '구매 후 이메일 배송' : 'Emailed after purchase';
      }
      remove.className = 'cart-remove';
      remove.type = 'button';
      remove.textContent = 'x';
      remove.setAttribute('aria-label', `Remove ${item.name}`);
      remove.addEventListener('click', () => removeFromCart(item.id));
      details.append(name, document.createElement('br'), type);
      actions.className = 'cart-item-actions';
      if (locked) actions.append(locked);
      actions.append(price, remove);
      li.append(details, actions);
      list.appendChild(li);
    });
  });
}

function checkoutCart() {
  const items = getCart();
  if (!items.length) return;

  const hasCoaching = items.some(item => item.type === 'Coaching');
  window.location.href = sitePath(hasCoaching ? 'intake.html' : 'payment.html');
}

function wireCart() {
  document.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', event => {
      event.preventDefault();
      addToCart(btn.dataset.name, btn.dataset.price, btn.dataset.type, btn.dataset.productKey);
    });
  });

  document.querySelectorAll('.clear-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      saveCart([]);
      renderCart();
    });
  });

  document.querySelectorAll('[data-cart-checkout]').forEach(btn => {
    btn.addEventListener('click', checkoutCart);
  });
}

// Scroll-triggered reveals
function triggerReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    if (!el.classList.contains('visible')) observer.observe(el);
  });
}

// Calculator
function getPaidInFullSelection() {
  const programEl = document.getElementById('calcProgram');
  const monthsEl = document.getElementById('calcMonths');
  if (!programEl || !monthsEl) return null;

  const selectedProgram = programEl.options[programEl.selectedIndex];
  const rate = parseInt(programEl.value);
  const months = parseInt(monthsEl.value);
  const productKey = selectedProgram?.getAttribute('data-product-key') || '';
  let discount = 0;
  if (months >= 12) discount = 0.10;
  else if (months >= 6) discount = 0.05;

  const total = Math.round(rate * months * (1 - discount));
  const programName = (selectedProgram?.getAttribute('data-en') || selectedProgram?.textContent || 'Coaching')
    .split('—')[0]
    .trim();

  return { programName, rate, months, discount, total, productKey };
}

function updateCalc() {
  const totalEl = document.getElementById('calcTotal');
  const discEl = document.getElementById('calcDiscount');
  const monthlyEl = document.getElementById('calcMonthly');
  const selection = getPaidInFullSelection();
  if (!selection || !totalEl || !discEl || !monthlyEl) return;

  totalEl.textContent = formatMoney(selection.total, 'USD');

  if (selection.discount > 0) {
    discEl.classList.remove('is-hidden');
    discEl.textContent = (selection.discount * 100) + '% OFF APPLIED';
    monthlyEl.textContent = currentLang === 'ko'
      ? `${formatMoney(selection.rate, 'USD')}/월 x ${selection.months}개월`
      : `${formatMoney(selection.rate, 'USD')}/month x ${selection.months} months`;
  } else {
    discEl.classList.add('is-hidden');
    monthlyEl.textContent = currentLang === 'ko' ? '표준 월 요금' : 'Standard monthly rate';
  }
}

function addPaidInFullToCart() {
  const selection = getPaidInFullSelection();
  if (!selection) return;
  const monthLabel = currentLang === 'ko' ? `${selection.months}개월` : `${selection.months} month${selection.months === 1 ? '' : 's'}`;
  addToCart(`${selection.programName} - Paid in Full (${monthLabel})`, '$' + selection.total, 'Coaching', selection.productKey, selection.months);
}

// Radio buttons
function selectRadio(btn, groupId) {
  document.querySelectorAll('#' + groupId + ' .radio-btn').forEach(b => {
    const selected = b === btn;
    b.classList.toggle('selected', selected);
    b.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
  const hidden = document.querySelector(`[data-radio-input="${groupId}"]`);
  if (hidden) hidden.value = btn.dataset.value || btn.textContent.trim();
}

// Mobile menu
function toggleMenu(forceOpen) {
  const menu = document.getElementById('mobileMenu');
  const button = document.getElementById('hamburger');
  if (!menu) return;
  const isOpen = typeof forceOpen === 'boolean' ? forceOpen : !menu.classList.contains('open');
  menu.classList.toggle('open', isOpen);
  menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
  if (button) button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

async function loadPartial(targetId, url) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url}`);
  target.innerHTML = await response.text();
}

async function loadSharedPartials() {
  await Promise.all([
    loadPartial('site-header', sitePath('partials/header.html')),
    loadPartial('site-footer', sitePath('partials/footer.html'))
  ]);
}

function initSharedAssetPaths() {
  document.querySelectorAll('.brand-logo-img, .footer-logo-img').forEach(img => {
    img.setAttribute('src', sitePath('assets/mainlogo.png'));
  });
}

function initLogoFallback() {
  document.querySelectorAll('.brand-logo-img').forEach(img => {
    const showFallback = () => {
      img.hidden = true;
      img.closest('.logo-mark')?.classList.add('logo-missing');
    };
    img.addEventListener('error', showFallback, { once: true });
    if (img.complete && img.naturalWidth === 0) showFallback();
  });
}

function wireSharedEvents() {
  document.addEventListener('click', event => {
    const langToggle = event.target.closest('[data-lang-toggle]');
    if (langToggle) {
      event.preventDefault();
      toggleLang();
      return;
    }

    const menuToggle = event.target.closest('[data-menu-toggle]');
    if (menuToggle) {
      event.preventDefault();
      toggleMenu();
      return;
    }

    const nav = event.target.closest('[data-navigate]');
    if (nav) {
      event.preventDefault();
      navigate(nav.dataset.navigate);
      if (nav.hasAttribute('data-close-menu')) toggleMenu(false);
      return;
    }

    const radio = event.target.closest('[data-radio-group]');
    if (radio) {
      event.preventDefault();
      selectRadio(radio, radio.dataset.radioGroup);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const nav = event.target.closest('[data-navigate]');
    if (!nav || !nav.matches('[role="link"], [tabindex]')) return;
    event.preventDefault();
    navigate(nav.dataset.navigate);
  });

  document.querySelectorAll('#calcProgram, #calcMonths').forEach(el => {
    el.addEventListener('change', updateCalc);
  });

  document.querySelectorAll('[data-add-calc-cart]').forEach(btn => {
    btn.addEventListener('click', addPaidInFullToCart);
  });

  document.querySelectorAll('.radio-btn').forEach(btn => {
    btn.setAttribute('aria-pressed', btn.classList.contains('selected') ? 'true' : 'false');
  });
}

function wireContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent('CM Strength coaching inquiry');
    const body = encodeURIComponent([
      `Name: ${data.get('name') || ''}`,
      `Email: ${data.get('email') || ''}`,
      `Phone / KakaoTalk: ${data.get('contact') || ''}`,
      `Financial readiness: ${data.get('financialReadiness') || ''}`,
      `Stage of hiring: ${data.get('stageOfHiring') || ''}`,
      '',
      'Message:',
      data.get('message') || ''
    ].join('\n'));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });
}

function wireIntakeForm() {
  const form = document.getElementById('intakeForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const lines = ['Comprehensive Client Intake Assessment', ''];
    for (const [key, value] of data.entries()) {
      lines.push(`${key}: ${value || ''}`);
    }
    const subject = encodeURIComponent('CM Strength client intake form');
    const body = encodeURIComponent(lines.join('\n'));
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setTimeout(() => {
      window.location.href = sitePath('payment.html');
    }, 900);
  });
}

function wireStripeCheckoutForm() {
  const form = document.getElementById('stripeCheckoutForm');
  if (!form) return;

  const packageEl = document.getElementById('paymentPackage');
  const serviceEl = document.getElementById('paymentServiceLabel');
  const amountEl = document.getElementById('paymentAmountLabel');
  const statusEl = document.getElementById('paymentStatus');
  const cartSummaryEl = document.getElementById('paymentCartSummary');
  const cartItems = getCart();
  const hasCartItems = cartItems.length > 0;

  const checkoutItems = () => getCart().map(item => ({
    productKey: item.productKey,
    quantity: 1,
    months: item.months || undefined
  }));

  const syncSummary = () => {
    if (hasCartItems) {
      const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
      if (serviceEl) serviceEl.textContent = `${cartItems.length} cart item${cartItems.length === 1 ? '' : 's'}`;
      if (amountEl) amountEl.textContent = formatMoney(total, 'USD');
      if (packageEl) packageEl.closest('.form-field')?.classList.add('is-hidden');
      if (cartSummaryEl) {
        cartSummaryEl.replaceChildren(...cartItems.map(item => {
          const row = document.createElement('div');
          const name = document.createElement('span');
          const price = document.createElement('strong');
          name.textContent = item.name;
          price.textContent = formatMoney(item.price, 'USD');
          row.append(name, price);
          return row;
        }));
      }
      return;
    }

    const selected = PAYMENT_PACKAGES[packageEl?.value] || PAYMENT_PACKAGES['coaching-virtual'];
    if (serviceEl) serviceEl.textContent = selected.label;
    if (amountEl) amountEl.textContent = selected.amount;
    if (cartSummaryEl) cartSummaryEl.textContent = 'No cart items found. Choose a coaching package below.';
  };

  packageEl?.addEventListener('change', syncSummary);
  syncSummary();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (statusEl) statusEl.textContent = 'Creating secure Stripe Checkout...';

    try {
      const items = checkoutItems();
      if (hasCartItems && items.some(item => !item.productKey)) {
        throw new Error('One or more cart items is missing secure checkout data. Please remove it and add it again.');
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.value,
          package: packageEl?.value,
          items: hasCartItems ? items : undefined
        })
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Checkout is not available yet.');
      window.location.href = data.url;
    } catch (error) {
      if (statusEl) statusEl.textContent = error.message;
    }
  });
}

async function fulfillCheckoutSession() {
  const statusEl = document.getElementById('paymentFulfillmentStatus');
  if (!statusEl) return;

  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  if (!sessionId) {
    statusEl.textContent = 'Payment confirmed. If you purchased a PDF, check your email shortly.';
    return;
  }

  try {
    const response = await fetch('/api/fulfill-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Delivery confirmation is still processing.');

    statusEl.textContent = data.delivered
      ? 'PDF delivery has been triggered. Check your inbox and spam folder.'
      : 'Payment confirmed. Coaching clients will receive next steps by email.';
  } catch (error) {
    statusEl.textContent = `${error.message} If your email does not arrive, contact coach.cmstrength@gmail.com with your checkout reference.`;
  }
}

function initFloatingSocials() {
  const social = document.querySelector('.floating-social');
  const close = document.querySelector('.float-close');
  if (!social || !close) return;
  close.addEventListener('click', () => {
    social.classList.add('is-closing');
    const hideSocials = () => {
      social.classList.add('is-closed');
      social.classList.remove('is-closing');
    };
    social.addEventListener('animationend', hideSocials, { once: true });
    setTimeout(hideSocials, 700);
  });
}

function initCursor() {
  const cursor = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursorRing');
  if (!cursor || !cursorRing || window.matchMedia('(pointer: coarse)').matches) return;
  const trailDots = Array.from({ length: 6 }, () => {
    const dot = document.createElement('span');
    dot.className = 'cursor-trail';
    document.body.appendChild(dot);
    return { el: dot, x: 0, y: 0 };
  });
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
    document.body.classList.add('cursor-ready');
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top = ringY + 'px';
    trailDots.forEach((dot, index) => {
      const leader = index === 0 ? { x: ringX, y: ringY } : trailDots[index - 1];
      dot.x += (leader.x - dot.x) * 0.22;
      dot.y += (leader.y - dot.y) * 0.22;
      dot.el.style.left = dot.x + 'px';
      dot.el.style.top = dot.y + 'px';
      dot.el.style.opacity = String(Math.max(0.05, 0.22 - index * 0.028));
    });
    requestAnimationFrame(animateRing);
  }
  animateRing();

  const interactiveSelector = 'a, button, input, textarea, select, label, [role="button"], .service-card, .program-card, .blog-card, .package-card, .radio-btn';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(interactiveSelector)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(interactiveSelector)) document.body.classList.remove('cursor-hover');
  });
  document.addEventListener('mousedown', () => document.body.classList.add('cursor-down'));
  document.addEventListener('mouseup', () => document.body.classList.remove('cursor-down'));
  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-ready', 'cursor-hover', 'cursor-down'));
  document.addEventListener('mouseenter', () => document.body.classList.add('cursor-ready'));
}

window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadSharedPartials();

  if (window.location.pathname.endsWith('payment-success.html')) {
    saveCart([]);
    fulfillCheckoutSession();
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const initialTarget = document.getElementById('page-' + currentPageName()) || document.querySelector('.page');
  if (initialTarget) {
    document.body.dataset.page = initialTarget.id.replace('page-', '');
    initialTarget.classList.add('active');
  }

  setActiveNav();
  initSharedAssetPaths();
  initLogoFallback();
  wireSharedEvents();
  wireContactForm();
  wireIntakeForm();
  wireStripeCheckoutForm();
  initFloatingSocials();
  wireCart();
  updateCalc();
  renderCart();
  triggerReveal();
  applyLang();
  initCursor();
  window.addEventListener('scroll', triggerReveal, { passive: true });
});
