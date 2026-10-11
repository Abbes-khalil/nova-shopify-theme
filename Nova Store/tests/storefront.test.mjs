import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const load = (file) => readFile(new URL('../assets/' + file, import.meta.url), 'utf8');
const response = (data, ok = true) => ({ ok, status: ok ? 200 : 422, json: async () => data, text: async () => JSON.stringify(data) });
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };

async function cartHarness(fetcher) {
  const calls = [];
  const messages = [{ textContent: '' }];
  const count = { textContent: '0' };
  const link = { attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } };
  const region = { dataset: { sectionId: 'cart-drawer' }, innerHTML: 'OLD', setAttribute() {}, querySelectorAll: () => [] };
  const events = [];
  const document = {
    activeElement: null,
    querySelectorAll(selector) {
      if (selector === '[data-cart-region]') return [region];
      if (selector === '[data-cart-status]') return messages;
      if (selector === '.nova-header__count') return [count];
      if (selector === '.nova-header__cart') return [link];
      return [];
    },
    querySelector: () => null,
    getElementById: () => null,
    addEventListener() {},
    dispatchEvent(event) { events.push(event); }
  };
  const window = { addEventListener() {}, Nova: { routes: { cart: '/fr/cart', add: '/fr/cart/add', change: '/fr/cart/change', update: '/fr/cart/update' }, strings: { cartError: 'Cart error', refreshError: 'Confirm your cart', updated: 'Cart: __COUNT__', cartCount: 'Cart, __COUNT__ items' } } };
  const context = vm.createContext({ window, document, URL, AbortController, location: { origin: 'https://demo.test' }, CustomEvent: class { constructor(type, values) { this.type = type; this.detail = values.detail; } }, DOMParser: class { parseFromString(text) { const data = JSON.parse(text); return { querySelector: () => data.valid === false ? null : { innerHTML: data.markup } }; } }, fetch: async (url, options) => { calls.push({ url: String(url), options }); return fetcher(url, options, calls.length); } });
  vm.runInContext(await load('cart.js'), context);
  return { api: window.NovaCart, calls, region, count, link, messages, events };
}

test('AJAX add uses localized route and server-rendered totals/count', async () => {
  const h = await cartHarness(async (url) => String(url).endsWith('/add.js') ? response({ sections: { 'cart-drawer': JSON.stringify({ markup: 'SERVER TOTAL $83.25' }) } }) : response({ item_count: 3, total_price: 8325 }));
  assert.equal(await h.api.add('987654321', 2), true);
  const body = JSON.parse(h.calls[0].options.body);
  assert.equal(body.items[0].id, '987654321');
  assert.equal(body.items[0].quantity, 2);
  assert.equal(body.sections_url, '/fr/cart');
  assert.equal(h.region.innerHTML, 'SERVER TOTAL $83.25');
  assert.equal(h.count.textContent, '3');
  assert.equal(h.link.attributes['aria-label'], 'Cart, 3 items');
  assert.equal(h.events[0].detail.total_price, 8325);
});

test('missing bundled sections recover by a read without repeating add', async () => {
  const h = await cartHarness(async (url) => String(url).endsWith('/add.js') ? response({ sections: { 'cart-drawer': null } }) : String(url).includes('sections=') ? response({ 'cart-drawer': JSON.stringify({ markup: 'RECOVERED TOTAL' }) }) : response({ item_count: 1 }));
  assert.equal(await h.api.add('123'), true);
  assert.equal(h.calls.filter((call) => call.options?.method === 'POST').length, 1);
  assert.equal(h.region.innerHTML, 'RECOVERED TOTAL');
});

test('an ambiguous network failure rereads cart and never replays mutation', async () => {
  const h = await cartHarness(async (url, options) => { if (options?.method === 'POST') throw new Error('Network unavailable'); return String(url).includes('sections=') ? response({ 'cart-drawer': JSON.stringify({ markup: 'ACTUAL CART' }) }) : response({ item_count: 1 }); });
  assert.equal(await h.api.add('123'), false);
  assert.equal(h.calls.filter((call) => call.options?.method === 'POST').length, 1);
  assert.equal(h.count.textContent, '1');
  assert.equal(h.region.innerHTML, 'ACTUAL CART');
});

test('stock rejection surfaces Shopify error without duplicate mutations', async () => {
  const h = await cartHarness(async (url, options) => options?.method === 'POST' ? response({ description: 'Only 2 are available.' }, false) : String(url).includes('sections=') ? response({ 'cart-drawer': JSON.stringify({ markup: 'UNCHANGED' }) }) : response({ item_count: 0 }));
  assert.equal(await h.api.add('123', 100), false);
  assert.equal(h.messages[0].textContent, 'Only 2 are available.');
  assert.equal(h.calls.filter((call) => call.options?.method === 'POST').length, 1);
});

test('concurrent cart mutations are blocked until the current response settles', async () => {
  const pending = deferred();
  const h = await cartHarness(async (url) => String(url).endsWith('/add.js') ? pending.promise : response({ item_count: 1 }));
  const first = h.api.add('123');
  assert.equal(await h.api.add('123'), false);
  pending.resolve(response({ sections: { 'cart-drawer': JSON.stringify({ markup: 'ONCE' }) } }));
  assert.equal(await first, true);
  assert.equal(h.calls.filter((call) => call.options?.method === 'POST').length, 1);
});

test('line removal uses the real key and zero quantity, not a positional index', async () => {
  const h = await cartHarness(async () => response({ item_count: 0, total_price: 0, sections: { 'cart-drawer': JSON.stringify({ markup: 'EMPTY CART' }) } }));
  assert.equal(await h.api.remove('123:abc:discount'), true);
  assert.deepEqual(JSON.parse(h.calls[0].options.body).id, '123:abc:discount');
  assert.equal(JSON.parse(h.calls[0].options.body).quantity, 0);
  assert.equal(h.region.innerHTML, 'EMPTY CART');
});

async function productHarness(fetcher, rules = { min: '1', step: '1', max: '5' }, previousQuantity = '1') {
  const classes = new Map();
  let quantity;
  let purchase = { querySelector(selector) { if (selector === '[name="quantity"]') return { value: previousQuantity }; return { disabled: false }; }, setAttribute() {}, removeAttribute() {}, replaceWith(next) { purchase = next; } };
  const status = { textContent: '' };
  const urls = [];
  const media = [];
  const context = vm.createContext({ HTMLElement: class {}, customElements: { get: (name) => classes.get(name), define: (name, type) => classes.set(name, type) }, AbortController, URL, location: { href: 'https://demo.test/products/tee', origin: 'https://demo.test', assign: (url) => urls.push(String(url)) }, history: { replaceState: (_a, _b, url) => urls.push(String(url)) }, fetch: fetcher, DOMParser: class { parseFromString(text) { const data = JSON.parse(text); quantity = { type: 'number', ...rules }; const next = { querySelector(selector) { if (selector.startsWith('[data-variant-radio]') || selector === '[name="selling_plan"]') return null; if (selector === '[data-variant-select]') return { value: data.id, focus() {} }; if (selector === '[name="quantity"]') return quantity; return { textContent: data.id }; }, removeAttribute() {} }; return { querySelector: (selector) => selector === 'nova-product' ? { dataset: { selectedMediaId: data.media } } : next }; } } });
  vm.runInContext(await load('product.js'), context);
  const product = new (classes.get('nova-product'))();
  product.dataset = { productUrl: '/products/tee', sectionId: 'main' };
  product.isConnected = true;
  product.requestVersion = 0;
  product.querySelector = (selector) => selector === '[data-product-purchase]' ? purchase : status;
  product.enhance = () => {};
  product.showMedia = (id) => media.push(id);
  return { product, urls, media, status, get quantity() { return quantity; } };
}

test('a stale variant response cannot overwrite the latest price/media/URL', async () => {
  const first = deferred();
  const second = deferred();
  const signals = [];
  const h = await productHarness((url, options) => { signals.push(options.signal); return url.searchParams.get('variant') === '1' ? first.promise : second.promise; });
  const a = h.product.selectVariant('1');
  const b = h.product.selectVariant('2');
  assert.equal(signals[0].aborted, true);
  second.resolve(response({ id: '2', media: 'media-2' }));
  await b;
  first.resolve(response({ id: '1', media: 'media-1' }));
  await a;
  assert.deepEqual(h.media, ['media-2']);
  assert.equal(h.urls.length, 1);
  assert.match(h.urls[0], /variant=2/);
});

test('a variant render error falls back to a read-only native variant URL', async () => {
  const h = await productHarness(async () => ({ ok: false }));
  await h.product.selectVariant('5');
  assert.equal(h.urls.length, 1);
  assert.match(h.urls[0], /variant=5/);
  assert(!h.urls[0].includes('section_id'));
});

test('catalogue seed preview is offline and contains the CDC prices/variants', () => {
  const script = fileURLToPath(new URL('../scripts/seed-products.mjs', import.meta.url));
  const output = JSON.parse(execFileSync(process.execPath, [script, '--dry-run', '--definitions'], { encoding: 'utf8', env: { ...process.env, SHOPIFY_ADMIN_ACCESS_TOKEN: '', SHOPIFY_STORE: '' } }));
  assert.equal(output.mode, 'dry-run');
  assert.equal(output.products.length, 6);
  assert.deepEqual(output.products.map((item) => item.price), ['49.00', '69.00', '79.00', '109.00', '39.00', '35.00']);
  assert.equal(output.products.reduce((count, item) => count + item.sizes.length, 0), 22);
  assert.equal(output.metaobjects.length, 2);
});

async function searchHarness(fetcher) {
  const classes = new Map();
  const input = { value: 'hoodie', setAttribute(name, value) { this[name] = value; } };
  const results = { hidden: true, replaceChildren(content) { this.content = content; } };
  const status = { textContent: '' };
  const context = vm.createContext({ HTMLElement: class {}, customElements: { get: (name) => classes.get(name), define: (name, type) => classes.set(name, type) }, AbortController, URL, location: { origin: 'https://demo.test' }, window: { Nova: { routes: { search: '/fr/search/suggest' }, strings: { searchLoading: 'Loading', searchError: 'Press Enter to search' } } }, fetch: fetcher, DOMParser: class { parseFromString(text) { const data = JSON.parse(text); return { querySelector: () => ({ title: data.title }) }; } } });
  vm.runInContext(await load('search.js'), context);
  const search = new (classes.get('nova-search'))();
  search.isConnected = true;
  search.input = input;
  search.results = results;
  search.status = status;
  return { search, input, results, status };
}

test('predictive search discards responses for an older query', async () => {
  const a = deferred();
  const b = deferred();
  const h = await searchHarness((url) => url.searchParams.get('q') === 'hoodie' ? a.promise : b.promise);
  h.search.queryVersion = 1;
  const first = h.search.suggest('hoodie', 1);
  h.input.value = 'jacket';
  h.search.queryVersion = 2;
  const second = h.search.suggest('jacket', 2);
  b.resolve(response({ title: 'Jacket result' }));
  await second;
  a.resolve(response({ title: 'Old hoodie result' }));
  await first;
  assert.equal(h.results.content.title, 'Jacket result');
  assert.equal(h.input['aria-expanded'], 'true');
});

test('predictive failure leaves native search submission available', async () => {
  const h = await searchHarness(async () => ({ ok: false }));
  h.search.queryVersion = 1;
  await h.search.suggest('hoodie', 1);
  assert.equal(h.results.hidden, true);
  assert.equal(h.status.textContent, 'Press Enter to search');
});

test('selling-plan price and compare-at follow the selected allocation', async () => {
  const h = await productHarness(async () => response({}));
  const price = { textContent: '' };
  const compare = { textContent: '', hidden: true };
  const option = { dataset: { planPrice: '$62.10 USD', planCompare: '$69.00 USD' } };
  h.product.querySelector = (selector) => selector === '[name="selling_plan"]' ? { selectedOptions: [option] } : selector === '[data-product-price]' ? price : compare;
  h.product.updatePlanPrice();
  assert.equal(price.textContent, '$62.10 USD');
  assert.equal(compare.textContent, '$69.00 USD');
  assert.equal(compare.hidden, false);
  option.dataset.planCompare = '';
  h.product.updatePlanPrice();
  assert.equal(compare.hidden, true);
});

test('variant change clamps quantity to a valid increment below the stock cap', async () => {
 const h=await productHarness(async()=>response({id:'22',media:'m22'}),{min:'2',step:'3',max:'7'},'8');
 await h.product.selectVariant('22');
 assert.equal(h.quantity.value,5);
});

test('multi-option choices resolve real IDs and reject nonexistent combinations', async () => {
 const classes=new Map(),handlers={};
 const context=vm.createContext({HTMLElement:class{},customElements:{get:name=>classes.get(name),define:(name,type)=>classes.set(name,type)},AbortController,URL,navigator:{},location:{href:'https://demo.test/products/tee'},window:{Nova:{strings:{unavailable:'Combination unavailable'}}}});
 vm.runInContext(await load('product.js'),context);
 const product=new (classes.get('nova-product'))();product.dataset={};product.addEventListener=(type,handler)=>{handlers[type]=handler};product.enhance=()=>{};product.showMedia=()=>{};
 const controls=[{value:'Small'},{value:'Black'}],button={disabled:false},stock={textContent:''},status={textContent:''},purchase={removeAttribute(){}};
 const variants=[{id:101,options:['Small','Black'],available:true},{id:102,options:['Large','White'],available:false}];
 product.querySelectorAll=selector=>selector==='[data-option-position]'?controls:[];
 product.querySelector=selector=>({'[data-option-variants]':{textContent:JSON.stringify(variants)},'[data-product-submit]':button,'[data-product-stock]':stock,'[data-variant-status]':status,'[data-product-purchase]':purchase}[selector]||null);
 const chosen=[];product.selectVariant=(id,position)=>chosen.push({id,position});product.connectedCallback();
 const event={target:{matches:selector=>selector==='[data-option-position]',dataset:{optionPosition:'2'}}};
 handlers.change(event);assert.deepEqual(chosen,[{id:'101',position:'2'}]);
 controls[0].value='Large';handlers.change(event);assert.equal(chosen.length,1);assert.equal(button.disabled,true);assert.equal(stock.textContent,'Combination unavailable');assert.equal(status.textContent,'Combination unavailable');
 controls[1].value='White';handlers.change(event);assert.deepEqual(chosen[1],{id:'102',position:'2'});
});

test('a failed stale variant request cannot redirect away from the newer selection', async () => {
 const first=deferred();const h=await productHarness(url=>String(url).includes('variant=11')?first.promise:response({id:'22',media:'m22'}));
 const older=h.product.selectVariant('11');await h.product.selectVariant('22');first.resolve(response({},false));await older;
 assert.equal(h.urls.length,1);assert.match(h.urls[0],/variant=22/);
});
