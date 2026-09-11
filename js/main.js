// Language system
const LANG_KEY = 'cmStrengthLanguage';
let currentLang = localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'ko';

function toggleLang() {
  currentLang = currentLang === 'en' ? 'ko' : 'en';
  localStorage.setItem(LANG_KEY, currentLang);
  applyLang();
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
  ['alt', 'aria-label', 'content'].forEach(attribute => {
    document.querySelectorAll(`[data-${attribute}-en]`).forEach(el => {
      el.setAttribute(attribute, el.getAttribute(`data-${attribute}-${currentLang}`));
    });
  });
  const locale = document.querySelector('meta[property="og:locale"]');
  if (locale) locale.content = currentLang === 'ko' ? 'ko_KR' : 'en_US';
  updateCalc();
  renderCart();
  document.dispatchEvent(new Event('languagechange'));
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
  'coaching-virtual': { label: { en: 'Virtual Coaching', ko: '비대면 코칭' }, amount: '₩200,000' },
  'coaching-body-profile': { label: { en: 'Body Profile', ko: '바디프로필' }, amount: '₩400,000' },
  'coaching-hybrid': { label: { en: 'Hybrid Coaching', ko: '하이브리드 코칭' }, amount: '₩600,000' },
  'coaching-s-tier': { label: { en: 'S-Tier', ko: 'S-Tier' }, amount: '₩800,000' },
  'coaching-in-person-single': { label: { en: '1:1 In-Person Session', ko: '1:1 대면 트레이닝 1회' }, amount: '₩60,000' },
  'coaching-in-person-10': { label: { en: '10 In-Person Sessions', ko: '1:1 대면 트레이닝 10회' }, amount: '₩500,000' }
};

const PRODUCT_PRICES_KRW = {
  'coaching-virtual': 200000,
  'coaching-body-profile': 400000,
  'coaching-hybrid': 600000,
  'coaching-s-tier': 800000,
  'coaching-in-person-single': 60000,
  'coaching-in-person-10': 500000,
  'pdf-first-flame-en': 60000,
  'pdf-lotus-en': 75000,
  'pdf-total-war-en': 75000,
  'pdf-dynasty-en': 100000,
  'pdf-hell-joseon-en': 75000
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
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
  return '₩' + Number(value || 0).toLocaleString('ko-KR');
}

function currencyForItem(item) {
  if (item.currency) return item.currency;
  return 'KRW';
}

function currencyFromPrice(price, type) {
  if (String(price || '').trim().startsWith('$')) return 'USD';
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

function localizeCartName(item) {
  const pdfNames = {
    'pdf-first-flame-en': 'The First Flame', 'pdf-lotus-en': 'Lotus V2',
    'pdf-total-war-en': 'Total War', 'pdf-dynasty-en': 'Dynasty', 'pdf-hell-joseon-en': 'Hell Joseon'
  };
  const name = PAYMENT_PACKAGES[item.productKey]?.label[currentLang]
    || (pdfNames[item.productKey] ? `${pdfNames[item.productKey]} - ${currentLang === 'ko' ? '영문 PDF' : 'English PDF'}` : item.name);
  const blocks = Number(item.months || 1); // Legacy storage key; each unit is a four-week block.
  return blocks > 1
    ? `${name} - ${currentLang === 'ko' ? `4주 × ${blocks}회 선납` : `${blocks} four-week blocks, paid in full`}`
    : name;
}

function priceForCartItem(item) {
  const rate = PRODUCT_PRICES_KRW[item.productKey];
  if (!rate) return item.price;
  const blocks = item.type === 'Coaching' ? Number(item.months || 1) : 1;
  const discount = blocks >= 12 ? 0.10 : blocks >= 6 ? 0.05 : 0;
  return Math.round(rate * blocks * (1 - discount));
}

function getCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(items)) return [];

    const migrated = items.map(item => {
      const currentPrice = PRODUCT_PRICES_KRW[item.productKey];
      return currentPrice
        ? { ...item, price: priceForCartItem(item), currency: 'KRW' }
        : item;
    });

    if (JSON.stringify(migrated) !== JSON.stringify(items)) {
      localStorage.setItem(CART_KEY, JSON.stringify(migrated));
    }
    return migrated;
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
    alert(currentLang === 'ko' ? '이 PDF는 아직 판매 준비 중입니다. 영문 PDF를 선택해 주세요.' : 'This PDF is not available yet. Please choose the English PDF.');
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
      name.textContent = localizeCartName(item);
      type.textContent = localizeCartType(item.type);
      price.textContent = formatMoney(item.price, itemCurrency);
      if (locked) {
        locked.className = 'cart-locked';
        locked.textContent = currentLang === 'ko' ? '구매 후 이메일 배송' : 'Emailed after purchase';
      }
      remove.className = 'cart-remove';
      remove.type = 'button';
      remove.textContent = 'x';
      remove.setAttribute('aria-label', currentLang === 'ko' ? `${localizeCartName(item)} 삭제` : `Remove ${localizeCartName(item)}`);
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

  window.location.href = sitePath('payment.html');
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

  totalEl.textContent = formatMoney(selection.total, 'KRW');

  if (selection.discount > 0) {
    discEl.classList.remove('is-hidden');
    discEl.textContent = (selection.discount * 100) + (currentLang === 'ko' ? '% 할인 적용' : '% OFF APPLIED');
    monthlyEl.textContent = currentLang === 'ko'
      ? `4주당 ${formatMoney(selection.rate, 'KRW')} × ${selection.months}회 (${selection.months * 4}주)`
      : `${formatMoney(selection.rate, 'KRW')} per 4 weeks × ${selection.months} blocks (${selection.months * 4} weeks)`;
  } else {
    discEl.classList.add('is-hidden');
    monthlyEl.textContent = currentLang === 'ko' ? `4주 × ${selection.months}회 (${selection.months * 4}주)` : `${selection.months} four-week block${selection.months === 1 ? '' : 's'} (${selection.months * 4} weeks)`;
  }
}

function addPaidInFullToCart() {
  const selection = getPaidInFullSelection();
  if (!selection) return;
  const monthLabel = currentLang === 'ko' ? `4주 × ${selection.months}회` : `${selection.months} four-week blocks`;
  addToCart(`${selection.programName} - Paid in Full (${monthLabel})`, '₩' + selection.total, 'Coaching', selection.productKey, selection.months);
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
    img.setAttribute('src', sitePath('assets/mainlogo-420.webp'));
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

  form.addEventListener('submit', async event => {
    event.preventDefault();
    await submitSiteForm(form, 'contact', 'contactFormStatus');
  });
}

function wireIntakeForm() {
  const form = document.getElementById('intakeForm');
  if (!form) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    await submitSiteForm(form, 'intake', 'intakeFormStatus');
  });
}

async function submitSiteForm(form, formType, statusId) {
  const statusEl = document.getElementById(statusId);
  const submitButton = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const fields = {};

  data.set('formType', formType);
  for (const [key, value] of data.entries()) {
    fields[key] = value;
  }

  if (statusEl) {
    statusEl.classList.remove('is-error');
    setFormStatus(statusEl, formType === 'intake' ? 'intakeSending' : 'contactSending');
  }
  if (submitButton) submitButton.disabled = true;

  try {
    const response = await fetch('/api/form-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formType, fields })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to send right now.');

    if (statusEl) {
      setFormStatus(statusEl, formType === 'intake' ? 'intakeSent' : 'contactSent');
    }
    form.reset();
    return true;
  } catch (error) {
    if (statusEl) {
      statusEl.classList.add('is-error');
      setFormStatus(statusEl, 'sendFailed');
    }
    if (submitButton) submitButton.disabled = false;
    return false;
  }
}

function setFormStatus(el, key) {
  el.dataset.formMessageKey = key;
  el.textContent = localizedFormMessage(key) + (key === 'sendFailed' ? ` ${localizedFormMessage('emailFallback')}` : '');
}

document.addEventListener('languagechange', () => {
  document.querySelectorAll('[data-form-message-key]').forEach(el => setFormStatus(el, el.dataset.formMessageKey));
});

function localizedFormMessage(key) {
  const messages = {
    contactSending: {
      en: 'Sending message...',
      ko: '메시지를 보내는 중...'
    },
    intakeSending: {
      en: 'Sending intake securely...',
      ko: '인테이크 양식을 안전하게 보내는 중...'
    },
    contactSent: {
      en: 'Message sent. I will reply as soon as possible.',
      ko: '메시지가 전송되었습니다. 가능한 한 빨리 답변드리겠습니다.'
    },
    intakeSent: {
      en: 'Intake received. Your coach will review it and contact you before training begins.',
      ko: '사전 설문이 접수되었습니다. 코치가 내용을 검토한 뒤 훈련 시작 전에 연락드립니다.'
    },
    sendFailed: { en: 'Your form could not be sent. Please try again.', ko: '양식을 보내지 못했습니다. 다시 시도해 주세요.' },
    emailFallback: {
      en: `You can also email ${CONTACT_EMAIL}.`,
      ko: `${CONTACT_EMAIL}로 직접 이메일을 보내셔도 됩니다.`
    }
  };

  return messages[key]?.[currentLang] || messages[key]?.en || '';
}

function prefillContactMessageFromQuery() {
  const packageEl = document.getElementById('contactPackage');
  const packageKey = new URLSearchParams(window.location.search).get('package');
  if (packageEl && PAYMENT_PACKAGES[packageKey]) packageEl.value = packageKey;
  const messageEl = document.getElementById('contactMessage');
  if (!messageEl || messageEl.value) return;

  if (new URLSearchParams(window.location.search).get('topic') === 'founding-offer') {
    const messages = { en: 'I would like to ask about the founding member offer, availability, and full terms.', ko: '첫 코칭 고객 특별 혜택의 신청 가능 여부와 자세한 조건을 문의하고 싶습니다.' };
    let previous = messages[currentLang];
    messageEl.value = previous;
    document.addEventListener('languagechange', () => {
      if (messageEl.value === previous) messageEl.value = messages[currentLang];
      previous = messages[currentLang];
    });
    return;
  }
  const message = new URLSearchParams(window.location.search).get('message');
  if (message) messageEl.value = message;
}

function wireStripeCheckoutForm() {
  const form = document.getElementById('stripeCheckoutForm');
  if (!form) return;

  const packageEl = document.getElementById('paymentPackage');
  const submitButton = form.querySelector('button[type="submit"]');
  const serviceEl = document.getElementById('paymentServiceLabel');
  const amountEl = document.getElementById('paymentAmountLabel');
  const statusEl = document.getElementById('paymentStatus');
  const cartSummaryEl = document.getElementById('paymentCartSummary');
  let statusKey = '';
  const updateStatus = key => {
    statusKey = key;
    if (statusEl) statusEl.textContent = localizedPaymentMessage(key);
  };
  document.addEventListener('languagechange', () => { if (statusKey) updateStatus(statusKey); });

  const checkoutItems = () => getCart().map(item => ({
    productKey: item.productKey,
    quantity: 1,
    months: item.months || undefined
  }));

  const syncSummary = () => {
    const cartItems = getCart();
    const hasCartItems = cartItems.length > 0;

    if (hasCartItems) {
      const total = cartItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
      if (serviceEl) serviceEl.textContent = currentLang === 'ko' ? `장바구니 상품 ${cartItems.length}개` : `${cartItems.length} cart item${cartItems.length === 1 ? '' : 's'}`;
      if (amountEl) amountEl.textContent = formatMoney(total, 'KRW');
      if (packageEl) packageEl.closest('.form-field')?.classList.add('is-hidden');
      if (cartSummaryEl) {
        cartSummaryEl.replaceChildren(...cartItems.map(item => {
          const row = document.createElement('div');
          const name = document.createElement('span');
          const price = document.createElement('strong');
          name.textContent = localizeCartName(item);
          price.textContent = formatMoney(item.price, 'KRW');
          row.append(name, price);
          return row;
        }));
      }
      return;
    }

    const selected = PAYMENT_PACKAGES[packageEl?.value] || PAYMENT_PACKAGES['coaching-virtual'];
    if (serviceEl) serviceEl.textContent = selected.label?.[currentLang] || selected.label?.en || selected.label;
    if (amountEl) amountEl.textContent = selected.amount;
    if (packageEl) packageEl.closest('.form-field')?.classList.remove('is-hidden');
    if (cartSummaryEl) cartSummaryEl.textContent = localizedPaymentMessage('emptyCart');
  };

  packageEl?.addEventListener('change', syncSummary);
  document.addEventListener('languagechange', syncSummary);
  syncSummary();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const items = checkoutItems();
    const hasCartItems = items.length > 0;
    updateStatus('creatingCheckout');
    if (submitButton) submitButton.disabled = true;

    try {
      if (hasCartItems && items.some(item => !item.productKey)) {
        throw new Error(localizedPaymentMessage('missingCartData'));
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.elements.namedItem('email').value,
          package: packageEl?.value,
          items: hasCartItems ? items : undefined,
          language: currentLang
        })
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || localizedPaymentMessage('checkoutUnavailable'));
      window.location.href = data.url;
    } catch (error) {
      updateStatus('checkoutUnavailable');
      if (submitButton) submitButton.disabled = false;
    }
  });
}

async function fulfillCheckoutSession() {
  const statusEl = document.getElementById('paymentFulfillmentStatus');
  if (!statusEl) return;

  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  if (!sessionId) {
    setPaymentStatus('missingSession');
    return;
  }

  try {
    const response = await fetch('/api/fulfill-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });
    const data = await response.json();

    if (!response.ok || !data.paid) throw new Error('Payment not verified');
    saveCart([]);
    renderCart();
    document.querySelectorAll('[data-payment-confirmed]').forEach(el => { el.hidden = false; });
    const onboarding = document.getElementById('coachingOnboarding');
    if (onboarding) onboarding.hidden = !data.has_coaching;
    setPaymentStatus(data.delivered ? 'pdfDeliveryTriggered' : 'coachingNextSteps');
  } catch (error) {
    setPaymentStatus('deliveryFallback');
  }
}

function setPaymentStatus(key) {
  const el = document.getElementById('paymentFulfillmentStatus');
  if (!el) return;
  el.dataset.messageKey = key;
  el.textContent = localizedPaymentMessage(key);
}

document.addEventListener('languagechange', () => {
  const el = document.getElementById('paymentFulfillmentStatus');
  if (el?.dataset.messageKey) setPaymentStatus(el.dataset.messageKey);
});

function localizedPaymentMessage(key) {
  const messages = {
    emptyCart: {
      en: 'No cart items found. Choose a coaching package below.',
      ko: '장바구니 항목이 없습니다. 아래에서 코칭 패키지를 선택하세요.'
    },
    creatingCheckout: {
      en: 'Creating secure Stripe Checkout...',
      ko: '안전한 Stripe 결제를 생성하는 중...'
    },
    missingSession: {
      en: 'No checkout reference was found. Open the confirmation link from your completed Stripe checkout, or contact your coach.',
      ko: '결제 참조 번호를 찾을 수 없습니다. Stripe 결제 완료 후 표시되는 확인 링크를 열거나 코치에게 문의해 주세요.'
    },
    pdfDeliveryTriggered: {
      en: 'PDF delivery has been triggered. Check your inbox and spam folder.',
      ko: 'PDF 발송이 시작되었습니다. 받은편지함과 스팸함을 확인해 주세요.'
    },
    coachingNextSteps: {
      en: 'Payment confirmed. Complete your coaching intake below before training begins.',
      ko: '결제가 확인되었습니다. 훈련 시작 전 아래의 코칭 사전 설문을 작성해 주세요.'
    },
    deliveryFallback: {
      en: 'We could not confirm payment or delivery here. If Stripe shows a completed payment, do not pay again. Contact coach.cmstrength@gmail.com with your checkout reference.',
      ko: '이 페이지에서 결제 또는 발송 상태를 확인하지 못했습니다. Stripe에서 결제가 완료되었다면 다시 결제하지 마세요. 결제 참조 번호와 함께 coach.cmstrength@gmail.com으로 문의해 주세요.'
    },
    missingCartData: {
      en: 'One or more cart items is missing secure checkout data. Please remove it and add it again.',
      ko: '장바구니 항목 중 일부에 안전 결제 정보가 없습니다. 해당 항목을 삭제한 뒤 다시 추가해 주세요.'
    },
    checkoutUnavailable: {
      en: 'Unable to open checkout. Please try again or contact your coach.',
      ko: '결제 페이지를 열지 못했습니다. 다시 시도하거나 코치에게 문의해 주세요.'
    }
  };

  return messages[key]?.[currentLang] || messages[key]?.en || '';
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
  if (!cursor || !cursorRing || window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return;
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
  prefillContactMessageFromQuery();
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
