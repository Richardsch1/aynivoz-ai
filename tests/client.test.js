import test from 'node:test';
import assert from 'node:assert/strict';

let instanceId = 0;

// Simulate only the DOM operations used by app.js. Browser focus and assistive
// technology behavior still require separate manual checks.
async function client(t) {
  const elements = new Map();
  const document = {
    activeElement: null,
    getElementById: id => elements.get(id),
    createElement: tag => new Element(tag),
  };
  class Element {
    constructor(id) {
      this.id = id;
      this.value = '';
      this.textContent = '';
      this.hidden = false;
      this.checked = false;
      this.disabled = false;
      this.children = [];
      this.listeners = new Map();
    }
    addEventListener(type, listener) {
      if (!this.listeners.has(type)) this.listeners.set(type, []);
      this.listeners.get(type).push(listener);
    }
    async emit(type) {
      const event = { currentTarget: this, preventDefault() {} };
      for (const listener of this.listeners.get(type) || []) await listener(event);
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    focus() { if (!this.hidden) document.activeElement = this; }
    scrollIntoView() {}
    reset() {
      for (const id of ['category', 'scope', 'locality', 'description']) elements.get(id).value = '';
      elements.get('provider').value = 'desconocido';
      elements.get('privacy').checked = false;
    }
  }
  for (const id of [
    'report-form', 'category', 'scope', 'provider', 'locality', 'description', 'privacy',
    'report-error', 'report-error-detail', 'message', 'draft', 'draft-section', 'reviewed',
    'download', 'ai-consent', 'ai-result', 'ai-status', 'ask-ai', 'demo', 'erase',
    'channel-list', 'catalog-status',
  ]) elements.set(id, new Element(id));
  elements.get('report-error').hidden = true;
  elements.get('draft-section').hidden = true;
  elements.get('download').disabled = true;
  elements.get('ask-ai').disabled = true;
  elements.get('provider').value = 'desconocido';
  const fields = ['category', 'scope', 'provider', 'locality', 'description'];
  class FormData {
    constructor(form) { assert.equal(form, elements.get('report-form')); }
    *[Symbol.iterator]() {
      for (const field of fields) yield [field, elements.get(field).value];
    }
  }
  const replacements = {
    document,
    window: { addEventListener() {} },
    FormData,
    fetch: async url => {
      assert.equal(url, '/api/config');
      return { json: async () => ({ aiAvailable: false }) };
    },
  };
  const originals = new Map(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  for (const [key, value] of Object.entries(replacements)) {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  await import(`../public/app.js?client-test=${++instanceId}`);
  const $ = id => elements.get(id);
  const fill = (description = 'EJEMPLO FICTICIO. Se observa falta de agua en varias viviendas de la zona.') => {
    for (const [field, value] of Object.entries({ category: 'sin-agua', scope: 'comunidad', provider: 'desconocido', locality: 'Distrito ficticio', description })) $(field).value = value;
    $('privacy').checked = true;
  };
  return { $, document, fill };
}

test('error del reporte recibe foco y conserva los campos sin crear un borrador', async t => {
  const { $, document, fill } = await client(t);
  const description = 'EJEMPLO FICTICIO. Consultar persona@example.invalid por la falta de agua.';
  fill(description);
  await $('report-form').emit('submit');
  assert.equal(document.activeElement, $('report-error'));
  assert.equal($('report-error').hidden, false);
  assert.match($('report-error-detail').textContent, /Elimina.*correos/);
  assert.equal($('message').textContent, '');
  assert.equal($('description').value, description);
  assert.equal($('locality').value, 'Distrito ficticio');
  assert.equal($('category').value, 'sin-agua');
  assert.equal($('scope').value, 'comunidad');
  assert.equal($('provider').value, 'desconocido');
  assert.equal($('privacy').checked, true);
  assert.equal($('draft').value, '');
  assert.equal($('draft-section').hidden, true);
  assert.equal($('download').disabled, true);
});

test('editar, cargar ejemplo y borrar descartan el resumen de error anterior', async t => {
  const { $, fill } = await client(t);
  for (const [control, event] of [['report-form', 'input'], ['demo', 'click'], ['erase', 'click']]) {
    fill('EJEMPLO FICTICIO. Consultar persona@example.invalid por la falta de agua.');
    await $('report-form').emit('submit');
    assert.equal($('report-error').hidden, false);
    assert.notEqual($('report-error-detail').textContent, '');
    await $(control).emit(event);
    assert.equal($('report-error').hidden, true, `${control}: oculta el error anterior`);
    assert.equal($('report-error-detail').textContent, '', `${control}: descarta su texto`);
  }
  assert.equal($('description').value, '');
  assert.equal($('privacy').checked, false);
});

test('registro válido enfoca el borrador y exige revisarlo de nuevo antes de descargar', async t => {
  const { $, document, fill } = await client(t);
  fill();
  await $('report-form').emit('submit');
  $('reviewed').checked = true;
  await $('reviewed').emit('change');
  assert.equal($('download').disabled, false);
  await $('report-form').emit('submit');
  assert.equal(document.activeElement, $('draft'));
  assert.equal($('draft-section').hidden, false);
  assert.match($('draft').value, /BORRADOR PARA REVISIÓN/);
  assert.match($('draft').value, /EJEMPLO FICTICIO/);
  assert.equal($('reviewed').checked, false);
  assert.equal($('download').disabled, true);
  assert.equal($('report-error').hidden, true);
  assert.equal($('report-error-detail').textContent, '');
  assert.match($('message').textContent, /Reporte registrado en esta pestaña/);
});
