const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/main.js'), 'utf8');
const pages = ['', 'posts'].flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(n => n.endsWith('.html')).map(n => path.join(dir, n)));

async function page(file, query = '') {
  const dom = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'), { url: `https://example.test/${file}${query}`, runScripts: 'outside-only' });
  const w = dom.window;
  await new Promise(resolve => w.document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  w.fetch = async url => ({ ok: true, text: async () => fs.readFileSync(path.join(root, String(url).replace(/^\.\.\//, '')), 'utf8') });
  w.eval(source);
  await w.loadSharedPartials();
  w.initSharedAssetPaths();
  return dom;
}

for (const file of pages.filter(p => p !== 'index.html')) {
  test(`${file}: full English/Korean switching preserves markup and translations`, async () => {
    const dom = await page(file);
    const { window: w } = dom;
    for (const language of ['ko', 'en', 'ko']) {
      if (w.document.documentElement.lang !== language) w.toggleLang();
      else w.applyLang();
      assert.equal(w.document.documentElement.lang, language);
      for (const el of w.document.querySelectorAll('[data-en]')) {
        assert.ok(el.dataset.ko, `${file}: missing Korean for ${el.dataset.en}`);
        assert.equal(el.textContent, el.getAttribute(`data-${language}`), `${file}: stale text ${el.dataset.en}`);
        if (!['S-Tier', 'Total War'].includes(el.dataset.en)) assert.match(el.dataset.ko, /[가-힣]/u, `${file}: untranslated ${el.dataset.en}`);
      }
      for (const attribute of ['alt', 'aria-label', 'content']) {
        for (const el of w.document.querySelectorAll(`[data-${attribute}-en]`)) {
          assert.equal(el.getAttribute(attribute), el.getAttribute(`data-${attribute}-${language}`));
        }
      }
      assert.ok(w.document.querySelector('#navbar'));
      assert.match(w.document.title, /CM Strength|보디빌딩|Bodybuilding/);
    }
    dom.window.close();
  });
}

test('each package enquiry preserves selection and rejects unknown query values', async () => {
  const coaching = new JSDOM(fs.readFileSync(path.join(root, 'coaching.html'), 'utf8'));
  const links = [...coaching.window.document.querySelectorAll('.package-card a.btn-apply')];
  assert.equal(links.length, 6);
  for (const link of links) {
    const query = '?' + link.getAttribute('href').split('?')[1];
    const dom = await page('contact.html', query);
    dom.window.prefillContactMessageFromQuery();
    assert.equal(dom.window.document.querySelector('#contactPackage').value, new URLSearchParams(query).get('package'));
    dom.window.close();
  }
  const invalid = await page('contact.html', '?package=unknown');
  invalid.window.prefillContactMessageFromQuery();
  assert.equal(invalid.window.document.querySelector('#contactPackage').value, 'unsure');
  assert.equal(invalid.window.document.querySelector('[name=financialReadiness]'), null);
  invalid.window.close(); coaching.window.close();
});

test('prepaid cart survives reload with correct discount and localized names', async () => {
  const dom = await page('cart.html');
  const w = dom.window;
  for (const [blocks, expected] of [[1, 200000], [3, 600000], [6, 1140000], [12, 2160000], [14, 2520000]]) {
    w.localStorage.setItem('cmStrengthCartItems', JSON.stringify([{ id: '1', productKey: 'coaching-virtual', type: 'Coaching', price: 200000, months: blocks, name: 'Old English name' }]));
    assert.equal(w.getCart()[0].price, expected);
    assert.equal(w.getCart()[0].price, expected);
    w.applyLang();
    assert.match(w.document.querySelector('.cart-items strong').textContent, /비대면 코칭/);
  }
  w.toggleLang();
  assert.match(w.document.querySelector('.cart-items strong').textContent, /14 four-week blocks/);
  dom.window.close();
});

test('payment summary responds to language switching', async () => {
  const dom = await page('payment.html'); const w = dom.window;
  w.saveCart([{ id: '1', productKey: 'coaching-virtual', type: 'Coaching', months: 6, price: 1140000 }]);
  w.wireStripeCheckoutForm(); w.applyLang();
  assert.equal(w.document.querySelector('#paymentServiceLabel').textContent, '장바구니 상품 1개');
  assert.equal(w.document.querySelector('#paymentAmountLabel').textContent, '₩1,140,000');
  w.toggleLang();
  assert.equal(w.document.querySelector('#paymentServiceLabel').textContent, '1 cart item');
  assert.match(w.document.querySelector('#paymentCartSummary').textContent, /6 four-week blocks/);
  dom.window.close();
});

test('payment confirmation requires verified payment before clearing cart or exposing intake', async () => {
  for (const scenario of ['missing', 'unpaid', 'paid-pdf', 'paid-coaching', 'mixed']) {
    const dom = await page('payment-success.html', scenario === 'missing' ? '' : '?session_id=cs_test_fixture');
    const w = dom.window;
    w.saveCart([{ id: '1', name: 'Test', price: 1 }]);
    w.fetch = async () => ({ ok: scenario !== 'unpaid', json: async () => ({ paid: scenario !== 'unpaid', delivered: scenario !== 'paid-coaching', has_coaching: ['mixed', 'paid-coaching'].includes(scenario) }) });
    await w.fulfillCheckoutSession();
    const paid = !['missing', 'unpaid'].includes(scenario);
    assert.equal(w.getCart().length, paid ? 0 : 1, scenario);
    assert.equal(w.document.querySelector('#coachingOnboarding').hidden, !['mixed', 'paid-coaching'].includes(scenario));
    assert.equal(w.document.querySelector('[data-payment-confirmed]').hidden, !paid);
    w.toggleLang();
    assert.doesNotMatch(w.document.querySelector('#paymentFulfillmentStatus').textContent, /[가-힣]/u);
    dom.window.close();
  }
});

test('enquiry submits selected package and start timing; intake completes without a payment redirect', async () => {
  const dom = await page('contact.html', '?package=coaching-hybrid'); const w = dom.window;
  w.prefillContactMessageFromQuery();
  w.document.querySelector('#contactName').value = 'Test';
  w.document.querySelector('#contactEmail').value = 'test@example.test';
  w.document.querySelector('#contactMessage').value = 'Question';
  let payload;
  w.fetch = async (_, options) => { payload = JSON.parse(options.body); return { ok: true, json: async () => ({ ok: true }) }; };
  assert.equal(await w.submitSiteForm(w.document.querySelector('form'), 'contact', 'contactFormStatus'), true);
  assert.equal(payload.fields.package, 'coaching-hybrid'); assert.equal(payload.fields.startTiming, 'exploring');
  w.toggleLang(); assert.match(w.document.querySelector('#contactFormStatus').textContent, /Message sent/);
  dom.window.close();
  const intake = await page('intake.html');
  intake.window.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) });
  intake.window.wireIntakeForm();
  intake.window.document.querySelector('form').dispatchEvent(new intake.window.Event('submit', { cancelable: true }));
  await new Promise(resolve => setImmediate(resolve));
  assert.match(intake.window.document.querySelector('#intakeFormStatus').textContent, /접수/);
  assert.equal(intake.window.location.pathname, '/intake.html');
  intake.window.close();
});

test('all local page links and images resolve; IDs are unique', () => {
  for (const file of pages) {
    const dom = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'));
    const doc = dom.window.document;
    const ids = [...doc.querySelectorAll('[id]')].map(el => el.id);
    assert.equal(ids.length, new Set(ids).size, `Duplicate IDs in ${file}`);
    for (const el of doc.querySelectorAll('a[href], img[src]')) {
      const ref = el.getAttribute('href') || el.getAttribute('src');
      if (/^(?:https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
      const local = decodeURI(ref.split(/[?#]/)[0]);
      assert.ok(fs.existsSync(path.resolve(root, path.dirname(file), local)), `${file}: missing ${local}`);
    }
    dom.window.close();
  }
});

test('offer enquiry is localized and language changes preserve user edits', async () => {
  const dom = await page('contact.html', '?topic=founding-offer'); const w = dom.window;
  w.prefillContactMessageFromQuery(); const message = w.document.querySelector('#contactMessage');
  assert.match(message.value, /특별 혜택/);
  w.toggleLang(); assert.match(message.value, /founding member offer/);
  message.value = 'My own question'; w.toggleLang(); assert.equal(message.value, 'My own question');
  dom.window.close();
});

test('checkout pending and failure messages follow language changes', async () => {
  const dom = await page('payment.html'); const w = dom.window;
  w.wireStripeCheckoutForm();
  let resolveFetch; let request;
  w.fetch = async (_, options) => { request = JSON.parse(options.body); return new Promise(resolve => { resolveFetch = resolve; }); };
  w.document.querySelector('#payEmail').value = 'fixture@example.test';
  w.document.querySelector('form').dispatchEvent(new w.Event('submit', { cancelable: true }));
  assert.equal(request.language, 'ko');
  assert.match(w.document.querySelector('#paymentStatus').textContent, /안전한/);
  w.toggleLang(); assert.match(w.document.querySelector('#paymentStatus').textContent, /Creating/);
  resolveFetch({ ok: false, json: async () => ({ error: 'provider fixture error' }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.match(w.document.querySelector('#paymentStatus').textContent, /Unable/);
  w.toggleLang(); assert.match(w.document.querySelector('#paymentStatus').textContent, /결제 페이지/);
  dom.window.close();
});

test('reduced motion skips cursor animation and smooth navigation', async () => {
  const dom = await page('home.html'); const w = dom.window;
  w.matchMedia = () => ({ matches: true });
  w.initCursor(); assert.equal(w.document.querySelectorAll('.cursor-trail').length, 0);
  let scrolling; w.scrollTo = options => { scrolling = options; };
  w.IntersectionObserver = class { observe() {} };
  w.navigate('home'); assert.equal(scrolling.behavior, 'auto');
  const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
  const reducedRules = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.doesNotMatch(reducedRules, /animation:\s*marquee/);
  dom.window.close();
});
