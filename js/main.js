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
  inquire: 'contact.html'
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

function parseWon(value) {
  return Number(String(value || '').replace(/[^0-9]/g, '')) || 0;
}

function formatWon(value) {
  return 'KRW ' + Number(value || 0).toLocaleString('ko-KR');
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

function addToCart(name, price, type, file) {
  const items = getCart();
  const id = globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  items.push({ id, name, price: parseWon(price), type, file: file || '' });
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
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = items.length; });
  document.querySelectorAll('.cart-total').forEach(el => { el.textContent = formatWon(total); });
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
      const fileLink = item.file ? document.createElement('a') : null;
      name.textContent = item.name;
      type.textContent = localizeCartType(item.type);
      price.textContent = formatWon(item.price);
      if (fileLink) {
        fileLink.className = 'cart-file-link';
        fileLink.href = item.file;
        fileLink.target = '_blank';
        fileLink.rel = 'noreferrer';
        fileLink.textContent = currentLang === 'ko' ? 'PDF 열기' : 'Open PDF';
      }
      remove.className = 'cart-remove';
      remove.type = 'button';
      remove.textContent = 'x';
      remove.setAttribute('aria-label', `Remove ${item.name}`);
      remove.addEventListener('click', () => removeFromCart(item.id));
      details.append(name, document.createElement('br'), type);
      actions.className = 'cart-item-actions';
      if (fileLink) actions.append(fileLink);
      actions.append(price, remove);
      li.append(details, actions);
      list.appendChild(li);
    });
  });
}

function wireCart() {
  document.querySelectorAll('[data-add-cart]').forEach(btn => {
    btn.addEventListener('click', event => {
      event.preventDefault();
      addToCart(btn.dataset.name, btn.dataset.price, btn.dataset.type, btn.dataset.file);
    });
  });

  document.querySelectorAll('.clear-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      saveCart([]);
      renderCart();
    });
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
  let discount = 0;
  if (months >= 12) discount = 0.10;
  else if (months >= 6) discount = 0.05;

  const total = Math.round(rate * months * (1 - discount));
  const programName = (selectedProgram?.getAttribute('data-en') || selectedProgram?.textContent || 'Coaching')
    .split('—')[0]
    .trim();

  return { programName, rate, months, discount, total };
}

function updateCalc() {
  const totalEl = document.getElementById('calcTotal');
  const discEl = document.getElementById('calcDiscount');
  const monthlyEl = document.getElementById('calcMonthly');
  const selection = getPaidInFullSelection();
  if (!selection || !totalEl || !discEl || !monthlyEl) return;

  totalEl.textContent = formatWon(selection.total);

  if (selection.discount > 0) {
    discEl.classList.remove('is-hidden');
    discEl.textContent = (selection.discount * 100) + '% OFF APPLIED';
    monthlyEl.textContent = currentLang === 'ko'
      ? `${formatWon(selection.rate)}/월 x ${selection.months}개월`
      : `${formatWon(selection.rate)}/month x ${selection.months} months`;
  } else {
    discEl.classList.add('is-hidden');
    monthlyEl.textContent = currentLang === 'ko' ? '표준 월 요금' : 'Standard monthly rate';
  }
}

function addPaidInFullToCart() {
  const selection = getPaidInFullSelection();
  if (!selection) return;
  const monthLabel = currentLang === 'ko' ? `${selection.months}개월` : `${selection.months} month${selection.months === 1 ? '' : 's'}`;
  addToCart(`${selection.programName} - Paid in Full (${monthLabel})`, selection.total, 'Coaching');
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
    img.setAttribute('src', sitePath('assets/logo.png'));
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
    window.location.href = `mailto:madridchili96@gmail.com?subject=${subject}&body=${body}`;
  });
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
  initFloatingSocials();
  wireCart();
  updateCalc();
  renderCart();
  triggerReveal();
  applyLang();
  initCursor();
  window.addEventListener('scroll', triggerReveal, { passive: true });
});
