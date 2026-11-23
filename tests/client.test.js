import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNELS } from '../public/catalog.js';

let instanceId = 0;

function deferred() {
  let resolve, reject;
  const promise = new Promise((accept, fail) => { resolve = accept; reject = fail; });
  return { promise, resolve, reject };
}

// Simulate only the DOM operations used by app.js. Browser focus and assistive
// technology behavior still require separate manual checks.
async function client(t, { aiAvailable = false } = {}) {
  const elements = new Map();
  const downloads = { blobs: [], urls: [], clicks: [], revoked: [], timers: [], urlAttempts: 0, failure: null };
  const aiRequests = [];
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
      this.attributes = new Map();
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
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    removeAttribute(name) { this.attributes.delete(name); }
    get href() { return this.getAttribute('href') ?? ''; }
    set href(value) { this.setAttribute('href', value); }
    click() {
      assert.equal(this.id, 'a');
      downloads.clicks.push({ url: this.href, filename: this.download });
      if (downloads.failure === 'click') throw new Error('test-only-internal-download-detail');
    }
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
    'report-error', 'report-error-detail', 'report-error-link', 'message', 'draft', 'draft-section', 'draft-error', 'draft-error-detail', 'reviewed',
    'download', 'ai-consent', 'ai-result', 'ai-status', 'ask-ai', 'demo', 'erase',
    'channel-list', 'catalog-status', 'extra-help',
  ]) elements.set(id, new Element(id));
  elements.get('report-error').hidden = true;
  elements.get('draft-section').hidden = true;
  elements.get('draft-error').hidden = true;
  elements.get('download').disabled = true;
  elements.get('ask-ai').disabled = true;
  elements.get('provider').value = 'desconocido';
  elements.get('locality').setAttribute('aria-describedby', 'locality-help');
  elements.get('description').setAttribute('aria-describedby', 'description-help');
  elements.get('report-error-link').href = '#category';
  elements.get('report-error-link').textContent = 'Volver a revisar el formulario';
  const fields = ['category', 'scope', 'provider', 'locality', 'description'];
  class FormData {
    constructor(form) { assert.equal(form, elements.get('report-form')); }
    *[Symbol.iterator]() {
      for (const field of fields) yield [field, elements.get(field).value];
    }
  }
  const window = new Element('window');
  class TrackedBlob extends globalThis.Blob {
    constructor(...args) { super(...args); downloads.blobs.push(this); }
  }
  const replacements = {
    document,
    window,
    FormData,
    Blob: TrackedBlob,
    setTimeout: (callback, delay) => {
      downloads.timers.push({ callback, delay });
      return downloads.timers.length;
    },
    fetch: async (url, options) => {
      if (url === '/api/config') return { json: async () => ({ aiAvailable }) };
      assert.equal(url, '/api/assist');
      assert.equal(aiAvailable, true, 'la ayuda diferida requiere configuración explícita en la prueba');
      const response = deferred();
      // Deliberately ignore aborts so tests can deliver late responses deterministically.
      aiRequests.push({ options, ...response });
      return response.promise;
    },
  };
  const originals = new Map(Object.keys(replacements).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const urlOriginals = new Map(['createObjectURL', 'revokeObjectURL'].map(key => [key, Object.getOwnPropertyDescriptor(URL, key)]));
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
    for (const [key, descriptor] of urlOriginals) {
      if (descriptor) Object.defineProperty(URL, key, descriptor);
      else delete URL[key];
    }
  });
  for (const [key, value] of Object.entries(replacements)) {
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: () => {
    downloads.urlAttempts += 1;
    if (downloads.failure === 'url') throw new Error('test-only-internal-download-detail');
    const url = `blob:test-only-${downloads.urlAttempts}`;
    downloads.urls.push(url);
    return url;
  } });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: url => downloads.revoked.push(url) });
  await import(`../public/app.js?client-test=${++instanceId}`);
  const $ = id => elements.get(id);
  const fill = (description = 'EJEMPLO FICTICIO. Se observa falta de agua en varias viviendas de la zona.') => {
    for (const [field, value] of Object.entries({ category: 'sin-agua', scope: 'comunidad', provider: 'desconocido', locality: 'Distrito ficticio', description })) $(field).value = value;
    $('privacy').checked = true;
  };
  return { $, document, window, fill, downloads, aiRequests };
}

test('error del reporte recibe foco y conserva los campos sin crear un borrador', async t => {
  const { $, document, fill } = await client(t);
  const description = 'EJEMPLO FICTICIO. Consultar persona@example.invalid por la falta de agua.';
  fill(description);
  await $('report-form').emit('submit');
  assert.equal(document.activeElement, $('report-error'));
  assert.equal($('report-error').hidden, false);
  assert.match($('report-error-detail').textContent, /Elimina.*correos/);
  assert.equal($('description').getAttribute('aria-invalid'), 'true');
  assert.equal($('description').getAttribute('aria-describedby'), 'description-help report-error-detail');
  assert.equal($('report-error-link').href, '#description');
  assert.match($('report-error-link').textContent, /^Revisar .*descripción/iu);
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
    for (const field of ['category', 'scope', 'provider', 'privacy', 'locality', 'description']) {
      assert.equal($(field).getAttribute('aria-invalid'), null, `${control}: elimina la marca de ${field}`);
    }
    assert.equal($('locality').getAttribute('aria-describedby'), 'locality-help');
    assert.equal($('description').getAttribute('aria-describedby'), 'description-help');
    assert.equal($('report-error-link').href, '#category');
    assert.equal($('report-error-link').textContent, 'Volver a revisar el formulario');
  }
  assert.equal($('description').value, '');
  assert.equal($('privacy').checked, false);
});

test('registro válido enfoca el borrador y exige revisarlo de nuevo antes de descargar', async t => {
  const { $, document, fill } = await client(t);
  fill('EJEMPLO FICTICIO. Consultar persona@example.invalid por la falta de agua.');
  await $('report-form').emit('submit');
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
  assert.equal($('description').getAttribute('aria-invalid'), null);
  assert.equal($('description').getAttribute('aria-describedby'), 'description-help');
  assert.equal($('report-error-link').href, '#category');
  assert.match($('message').textContent, /Reporte registrado en esta pestaña/);
});

test('cambiar el campo con error conserva ayudas, elimina la marca anterior y evita asociaciones duplicadas', async t => {
  const { $, fill } = await client(t);
  $('description').setAttribute('aria-describedby', 'description-help extra-help');
  fill('EJEMPLO FICTICIO. Consultar persona@example.invalid por la falta de agua.');
  await $('report-form').emit('submit');
  await $('report-form').emit('submit');
  assert.equal($('description').getAttribute('aria-describedby'), 'description-help extra-help report-error-detail');
  assert.equal($('description').getAttribute('aria-invalid'), 'true');
  // Simulate another submission after values changed without an input event.
  fill();
  $('locality').value = 'Zona persona@example.invalid';
  await $('report-form').emit('submit');
  assert.equal($('locality').getAttribute('aria-invalid'), 'true');
  assert.equal($('locality').getAttribute('aria-describedby'), 'locality-help report-error-detail');
  assert.equal($('description').getAttribute('aria-invalid'), null);
  assert.equal($('description').getAttribute('aria-describedby'), 'description-help extra-help');
  assert.equal($('report-error-link').href, '#locality');
  assert.match($('report-error-link').textContent, /^Revisar .*zona/iu);
  await $('report-form').emit('input');
  assert.equal($('locality').getAttribute('aria-invalid'), null);
  assert.equal($('locality').getAttribute('aria-describedby'), 'locality-help');
  assert.equal($('description').getAttribute('aria-describedby'), 'description-help extra-help');
});

test('error sin un campo identificable conserva el resumen y el enlace general', async t => {
  const { $, document, fill } = await client(t);
  fill('0000: EJEMPLO FICTICIO. Se observa una interrupción de agua.');
  $('locality').value = 'Zona ficticia 000';
  await $('report-form').emit('submit');
  assert.equal(document.activeElement, $('report-error'));
  assert.equal($('report-error').hidden, false);
  assert.match($('report-error-detail').textContent, /Elimina números de identificación/);
  assert.equal($('report-error-link').href, '#category');
  assert.equal($('report-error-link').textContent, 'Volver a revisar el formulario');
  for (const field of ['category', 'scope', 'provider', 'privacy', 'locality', 'description']) {
    assert.equal($(field).getAttribute('aria-invalid'), null);
  }
  assert.equal($('locality').getAttribute('aria-describedby'), 'locality-help');
  assert.equal($('description').getAttribute('aria-describedby'), 'description-help');
  assert.equal($('draft-section').hidden, true);
});

test('enlaces del catálogo identifican cada canal y conservan destinos al cambiar o limpiar el prestador', async t => {
  const { $, window } = await client(t);
  const common = ['prestador', 'sunass', 'sunass-operativo'];
  const checkChannels = ids => {
    const articles = $('channel-list').children;
    assert.equal(articles.length, ids.length);
    const names = [];
    for (const [index, id] of ids.entries()) {
      const channel = CHANNELS.find(item => item.id === id);
      const links = articles[index].children.filter(child => child.id === 'a');
      assert.equal(links.length, 1);
      const link = links[0];
      const name = link.getAttribute('aria-label') || link.textContent;
      names.push(name);
      assert.equal(link.textContent, 'Consultar fuente oficial');
      assert.ok(name.includes('Consultar fuente oficial'));
      assert.ok(name.includes(channel.name), `${id}: el enlace identifica su canal`);
      assert.equal(link.href, channel.url);
      assert.equal(link.target, '_blank');
      assert.equal(link.rel, 'noopener noreferrer');
    }
    assert.equal(new Set(names).size, ids.length, 'cada enlace tiene un nombre distinto');
  };
  checkChannels(common);
  for (const action of ['provider', 'demo', 'erase', 'pagehide']) {
    $('provider').value = 'sedapal';
    await $('report-form').emit('input');
    checkChannels([...common, 'sedapal']);
    if (action === 'provider') {
      $('provider').value = 'otro';
      await $('report-form').emit('input');
    } else {
      await (action === 'pagehide' ? window : $(action)).emit(action === 'pagehide' ? 'pagehide' : 'click');
    }
    checkChannels(common);
  }
});

test('salir de la página limpia el reporte y restaura canales sin prestador confirmado', async t => {
  const { $, window, fill } = await client(t);
  const channelNames = () => $('channel-list').children.flatMap(channel =>
    channel.children.filter(child => child.id === 'h3').map(child => child.textContent));
  fill();
  $('provider').value = 'sedapal';
  await $('report-form').emit('input');
  await $('report-form').emit('submit');
  $('reviewed').checked = true;
  await $('reviewed').emit('change');
  $('ai-consent').checked = true;
  await $('ai-consent').emit('change');
  assert.equal($('download').disabled, false);
  assert.match($('message').textContent, /Reporte registrado/);
  assert.equal(channelNames().length, 4);
  assert.ok(channelNames().some(name => name.includes('Sedapal')));

  // Repeated lifecycle events must leave the same neutral state.
  for (let i = 0; i < 2; i += 1) {
    await window.emit('pagehide');
    for (const field of ['category', 'scope', 'locality', 'description']) assert.equal($(field).value, '');
    assert.equal($('provider').value, 'desconocido');
    assert.equal($('privacy').checked, false);
    assert.equal($('draft').value, '');
    assert.equal($('draft-section').hidden, true);
    assert.equal($('reviewed').checked, false);
    assert.equal($('download').disabled, true);
    assert.equal($('ai-consent').checked, false);
    assert.equal($('ai-result').textContent, '');
    assert.equal($('ask-ai').disabled, true);
    assert.equal($('report-error').hidden, true);
    assert.equal($('report-error-detail').textContent, '');
    assert.equal(channelNames().length, 3);
    assert.ok(channelNames().every(name => !name.includes('Sedapal')));
    assert.equal($('message').textContent, '');
  }

  fill();
  await $('report-form').emit('submit');
  assert.equal($('draft-section').hidden, false);
  assert.match($('draft').value, /Prestador competente: confirmar/);
  assert.equal($('reviewed').checked, false);
  assert.equal($('download').disabled, true);
});

test('descarga inválida enfoca el error local, conserva contenido y retira la revisión sin crear archivos', async t => {
  const { $, document, fill, downloads } = await client(t);
  fill();
  await $('report-form').emit('submit');
  $('ai-consent').checked = true;
  await $('ai-consent').emit('change');
  const description = $('description').value;
  for (const value of ['', 'EJEMPLO FICTICIO. <texto> que requiere revisar.']) {
    $('draft').value = value;
    await $('draft').emit('input');
    $('reviewed').checked = true;
    await $('reviewed').emit('change');
    $('download').focus();
    await $('download').emit('click');
    assert.equal($('draft-error').hidden, false);
    assert.match($('draft-error-detail').textContent, /^Borrador:/);
    assert.equal(document.activeElement, $('draft-error'));
    assert.equal($('message').textContent, '');
    assert.equal($('draft').value, value);
    assert.equal($('draft-section').hidden, false);
    assert.equal($('description').value, description);
    assert.equal($('locality').value, 'Distrito ficticio');
    assert.equal($('ai-consent').checked, true);
    assert.equal($('reviewed').checked, false);
    assert.equal($('download').disabled, true);
    assert.equal(downloads.blobs.length, 0);
    assert.equal(downloads.urlAttempts, 0);
    assert.equal(downloads.clicks.length, 0);
    assert.equal(downloads.timers.length, 0);
  }
});

test('editar o limpiar retira el error de descarga y exige una nueva revisión', async t => {
  const { $, window, fill, downloads } = await client(t);
  for (const [control, event] of [
    ['draft', 'input'], ['report-form', 'input'], ['demo', 'click'], ['erase', 'click'], ['window', 'pagehide'],
  ]) {
    fill();
    await $('report-form').emit('submit');
    $('draft').value = '';
    await $('draft').emit('input');
    $('reviewed').checked = true;
    await $('reviewed').emit('change');
    await $('download').emit('click');
    assert.equal($('draft-error').hidden, false);
    assert.notEqual($('draft-error-detail').textContent, '');
    if (control === 'draft') $('draft').value = 'EJEMPLO FICTICIO. Solicito revisar el servicio de agua.';
    await (control === 'window' ? window : $(control)).emit(event);
    assert.equal($('draft-error').hidden, true, control);
    assert.equal($('draft-error-detail').textContent, '', control);
    assert.equal($('reviewed').checked, false, control);
    assert.equal($('download').disabled, true, control);
  }
  fill();
  await $('report-form').emit('submit');
  assert.equal($('download').disabled, true);
  $('reviewed').checked = true;
  await $('reviewed').emit('change');
  assert.equal($('download').disabled, false);
  assert.equal(downloads.blobs.length, 0);
  assert.equal(downloads.urlAttempts, 0);
  assert.equal(downloads.clicks.length, 0);
});

test('fallos de descarga no filtran detalles, revocan URL creada y permiten recuperación ficticia', async t => {
  const { $, document, fill, downloads } = await client(t);
  fill();
  await $('report-form').emit('submit');
  const draft = $('draft').value;
  const generic = 'No se pudo iniciar la descarga. El borrador sigue disponible. Confirma la revisión para volver a intentarlo.';
  for (const failure of ['url', 'click']) {
    downloads.failure = failure;
    const urlsBefore = downloads.urls.length;
    const timersBefore = downloads.timers.length;
    $('reviewed').checked = true;
    await $('reviewed').emit('change');
    await $('download').emit('click');
    assert.equal($('draft-error').hidden, false);
    assert.equal($('draft-error-detail').textContent, generic);
    assert.equal(document.activeElement, $('draft-error'));
    assert.equal($('message').textContent, '');
    assert.equal($('draft').value, draft);
    assert.equal($('reviewed').checked, false);
    assert.equal($('download').disabled, true);
    if (failure === 'url') {
      assert.equal(downloads.urls.length, urlsBefore);
      assert.equal(downloads.timers.length, timersBefore);
    } else {
      assert.equal(downloads.urls.length, urlsBefore + 1);
      assert.equal(downloads.timers.length, timersBefore + 1);
      const timer = downloads.timers.at(-1);
      assert.equal(timer.delay, 1000);
      timer.callback();
      assert.deepEqual(downloads.revoked, downloads.urls);
    }
  }
  downloads.failure = null;
  $('reviewed').checked = true;
  await $('reviewed').emit('change');
  await $('download').emit('click');
  assert.equal($('draft-error').hidden, true);
  assert.equal($('draft-error-detail').textContent, '');
  assert.match($('message').textContent, /Descarga iniciada/);
  assert.deepEqual(downloads.clicks.at(-1), { url: downloads.urls.at(-1), filename: 'aynivoz-borrador-revisado.txt' });
  assert.equal(await downloads.blobs.at(-1).text(), draft);
  const timer = downloads.timers.at(-1);
  assert.equal(timer.delay, 1000);
  timer.callback();
  assert.deepEqual(downloads.revoked, downloads.urls);
});

test('ayuda opcional envía solo opciones autorizadas y mantiene el borrador mientras espera', async t => {
  const { $, fill, aiRequests, downloads } = await client(t, { aiAvailable: true });
  fill();
  $('provider').value = 'sedapal';
  await $('report-form').emit('submit');
  const draft = 'EJEMPLO FICTICIO. Texto local reservado para revisión manual.';
  $('draft').value = draft;
  await $('draft').emit('input');
  $('reviewed').checked = true;
  await $('reviewed').emit('change');
  assert.equal($('ask-ai').disabled, true);
  assert.equal(aiRequests.length, 0);
  $('ai-consent').checked = true;
  await $('ai-consent').emit('change');
  assert.equal($('ask-ai').disabled, false);
  const pending = $('ask-ai').emit('click');
  assert.equal(aiRequests.length, 1);
  const request = aiRequests[0];
  assert.equal(request.options.method, 'POST');
  assert.deepEqual(request.options.headers, { 'Content-Type': 'application/json' });
  assert.deepEqual(JSON.parse(request.options.body), { category: 'sin-agua', scope: 'comunidad', consent: true });
  assert.ok(request.options.signal instanceof AbortSignal);
  assert.equal(request.options.signal.aborted, false);
  assert.equal($('ask-ai').disabled, true);
  assert.equal($('draft').value, draft);
  const sentence = 'EJEMPLO FICTICIO. Solicito revisar el servicio de agua.';
  request.resolve({ ok: true, json: async () => ({ sentence }) });
  await pending;
  assert.equal($('ai-result').textContent, `Sugerencia sin verificar: ${sentence}`);
  assert.equal($('ask-ai').disabled, false);
  assert.equal($('draft').value, draft);
  assert.equal($('reviewed').checked, true);
  assert.equal($('download').disabled, false);
  assert.equal(downloads.blobs.length, 0);
  assert.equal(aiRequests.length, 1);
});

test('revocar, editar o limpiar aborta la ayuda y descarta resoluciones y errores tardíos', async t => {
  const { $, window, fill, aiRequests } = await client(t, { aiAvailable: true });
  for (const action of ['consent', 'edit', 'demo', 'erase', 'pagehide']) {
    for (const outcome of ['resolve', 'reject']) {
      fill();
      await $('report-form').emit('submit');
      $('reviewed').checked = true;
      await $('reviewed').emit('change');
      $('ai-consent').checked = true;
      await $('ai-consent').emit('change');
      assert.equal($('ask-ai').disabled, false);
      const pending = $('ask-ai').emit('click');
      const request = aiRequests.at(-1);
      const draft = $('draft').value;
      if (action === 'consent') {
        $('ai-consent').checked = false;
        await $('ai-consent').emit('change');
      } else if (action === 'edit') {
        $('description').value = 'EJEMPLO FICTICIO. Observación corregida para revisar el servicio.';
        await $('report-form').emit('input');
      } else await (action === 'pagehide' ? window : $(action)).emit(action === 'pagehide' ? 'pagehide' : 'click');
      assert.equal(request.options.signal.aborted, true, `${action}: aborta la petición`);
      assert.equal($('ai-result').textContent, '');
      assert.equal($('ai-consent').checked, false);
      assert.equal($('ask-ai').disabled, true);
      assert.equal($('draft').value, action === 'consent' ? draft : '');
      assert.equal($('draft-section').hidden, action !== 'consent');
      assert.equal($('reviewed').checked, action === 'consent');
      assert.equal($('download').disabled, action !== 'consent');
      const snapshot = ['description', 'locality', 'provider'].map(id => $(id).value);
      const message = $('message').textContent;
      const calls = aiRequests.length;
      if (outcome === 'resolve') request.resolve({ ok: true, json: async () => ({ sentence: 'EJEMPLO FICTICIO. Respuesta antigua que debe descartarse.' }) });
      else request.reject(new Error('test-only-late-provider-detail'));
      await pending;
      assert.equal($('ai-result').textContent, '', `${action}/${outcome}: no recupera contenido retirado`);
      assert.equal($('ask-ai').disabled, true);
      assert.equal($('ai-consent').checked, false);
      assert.equal($('draft').value, action === 'consent' ? draft : '');
      assert.equal($('draft-section').hidden, action !== 'consent');
      assert.equal($('reviewed').checked, action === 'consent');
      assert.equal($('download').disabled, action !== 'consent');
      assert.deepEqual(['description', 'locality', 'provider'].map(id => $(id).value), snapshot);
      assert.equal($('message').textContent, message);
      assert.equal(aiRequests.length, calls);
    }
  }
});

test('JSON antiguo resuelto tras revocar no altera el resultado ni la espera de una petición nueva', async t => {
  const { $, fill, aiRequests } = await client(t, { aiAvailable: true });
  fill();
  await $('report-form').emit('submit');
  const draft = $('draft').value;
  $('ai-consent').checked = true;
  await $('ai-consent').emit('change');
  assert.equal($('ask-ai').disabled, false);
  const first = $('ask-ai').emit('click');
  const json = deferred();
  const jsonStarted = deferred();
  aiRequests[0].resolve({ ok: true, json: () => { jsonStarted.resolve(); return json.promise; } });
  await jsonStarted.promise;
  $('ai-consent').checked = false;
  await $('ai-consent').emit('change');
  assert.equal(aiRequests[0].options.signal.aborted, true);
  $('ai-consent').checked = true;
  await $('ai-consent').emit('change');
  assert.equal($('ask-ai').disabled, false);
  const second = $('ask-ai').emit('click');
  assert.equal(aiRequests.length, 2);
  const waiting = $('ai-result').textContent;
  json.resolve({ sentence: 'EJEMPLO FICTICIO. Respuesta antigua que debe descartarse.' });
  await first;
  assert.equal($('ai-result').textContent, waiting);
  assert.equal($('ask-ai').disabled, true, 'el finally antiguo no libera la petición nueva');
  assert.equal(aiRequests[1].options.signal.aborted, false);
  const sentence = 'EJEMPLO FICTICIO. Respuesta actual para revisar el servicio.';
  aiRequests[1].resolve({ ok: true, json: async () => ({ sentence }) });
  await second;
  assert.equal($('ai-result').textContent, `Sugerencia sin verificar: ${sentence}`);
  assert.equal($('ask-ai').disabled, false);
  assert.equal($('draft').value, draft);
  assert.equal(aiRequests.length, 2);
});

test('fallos de ayuda conservan el borrador y solo se recuperan con otra petición explícita', async t => {
  const { $, fill, aiRequests, downloads } = await client(t, { aiAvailable: true });
  fill();
  await $('report-form').emit('submit');
  const draft = $('draft').value;
  $('reviewed').checked = true;
  await $('reviewed').emit('change');
  $('ai-consent').checked = true;
  await $('ai-consent').emit('change');
  for (const outcome of ['reject', 'http']) {
    assert.equal($('ask-ai').disabled, false);
    const pending = $('ask-ai').emit('click');
    const calls = aiRequests.length;
    if (outcome === 'reject') aiRequests.at(-1).reject(new Error('test-only-provider-detail'));
    else aiRequests.at(-1).resolve({ ok: false, json: async () => ({ error: 'test-only-provider-detail' }) });
    await pending;
    assert.equal($('ai-result').textContent, 'No se pudo obtener la sugerencia. Puedes continuar con el borrador local.');
    assert.equal($('ask-ai').disabled, false);
    assert.equal($('draft').value, draft);
    assert.equal($('reviewed').checked, true);
    assert.equal($('download').disabled, false);
    assert.equal(aiRequests.length, calls, 'no reintenta por sí solo');
  }
  const pending = $('ask-ai').emit('click');
  assert.equal(aiRequests.length, 3);
  const sentence = 'EJEMPLO FICTICIO. Solicito revisar el servicio descrito.';
  aiRequests.at(-1).resolve({ ok: true, json: async () => ({ sentence }) });
  await pending;
  assert.equal($('ai-result').textContent, `Sugerencia sin verificar: ${sentence}`);
  assert.equal($('draft').value, draft);
  assert.equal($('ask-ai').disabled, false);
  assert.equal(aiRequests.length, 3);
  assert.equal(downloads.blobs.length, 0);
});
