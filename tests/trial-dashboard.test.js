const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeElement(id) {
  const classes = new Set();
  return {
    id,
    dataset: {},
    style: {},
    value: '',
    innerHTML: '',
    textContent: '',
    className: '',
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        const shouldAdd = force === undefined ? !classes.has(name) : !!force;
        if (shouldAdd) classes.add(name);
        else classes.delete(name);
        return shouldAdd;
      },
    },
    addEventListener() {},
    appendChild() {},
    remove() {},
    click() {},
    scrollIntoView() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };
}

function loadApp(overrides = {}) {
  const elements = new Map();
  const document = {
    readyState: 'loading',
    body: makeElement('body'),
    head: makeElement('head'),
    addEventListener() {},
    createElement(tag) {
      const el = makeElement(tag);
      if (tag === 'script') {
        Object.defineProperty(el, 'src', {
          get() {
            return this._src;
          },
          set(value) {
            this._src = value;
          },
        });
      }
      return el;
    },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    querySelector(selector) {
      if (selector === '.hero') return this.getElementById('hero');
      return null;
    },
    querySelectorAll() {
      return [];
    },
  };

  let dataLoadCalls = 0;
  const context = {
    console,
    document,
    window: null,
    history: { replaceState() {} },
    location: { hash: '' },
    localStorage: {
      getItem(key) {
        return key === 'zjyk_phone' ? '13900000000' : null;
      },
      setItem() {},
      removeItem() {},
    },
    sessionStorage: { removeItem() {} },
    requestAnimationFrame(fn) {
      return setTimeout(fn, 0);
    },
    setTimeout,
    clearTimeout,
    Blob: function Blob() {},
    URL: { createObjectURL() { return ''; }, revokeObjectURL() {} },
    confirm() {
      return false;
    },
    alert() {},
    addEventListener() {},
    removeEventListener() {},
    __isLoggedIn: true,
    __isPaidUser: false,
    __adminAccess: false,
    isCoreDataLoaded() {
      return false;
    },
    ensureCoreDataLoaded() {
      dataLoadCalls += 1;
      return Promise.resolve({});
    },
    getDataLoadCalls() {
      return dataLoadCalls;
    },
    ...overrides,
  };
  context.window = context;

  const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
  vm.runInNewContext(source, context, { filename: 'app.js' });
  return { context, elements };
}

{
  const { context, elements } = loadApp();

  context.renderDashboard();

  assert.equal(
    context.getDataLoadCalls(),
    0,
    'trial dashboard should not block first render on full school data loading',
  );
  assert.doesNotMatch(
    elements.get('dashStats').innerHTML,
    /加载中|首次打开/,
    'trial dashboard should render usable content instead of the long initial-loading state',
  );
  assert.match(
    elements.get('dashEntries').innerHTML,
    /智能填报/,
    'trial dashboard should keep the score-entry path visible',
  );
}
