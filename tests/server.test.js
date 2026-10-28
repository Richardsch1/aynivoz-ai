import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server/app.js';
import { suggestSentence } from '../server/claude.js';

const input = { category: 'sin-agua', scope: 'comunidad', consent: true };
const env = { AI_ENABLED: 'true', ANTHROPIC_API_KEY: 'test-only-placeholder', CLAUDE_MODEL: 'test-model' };
const sentence = 'Solicito que se verifique la interrupción del servicio y se informe la atención que corresponda.';

async function instance(t, options = {}) {
  const server = createApp({ env: {}, ...options });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (body, headers = {}) => fetch(`${url}/api/assist`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: url, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });
  return { url, post };
}

test('sirve la aplicación con cabeceras restrictivas', async t => {
  const { url } = await instance(t);
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /lang="es-PE"/);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('permissions-policy'), /microphone=\(\)/);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});
test('no expone archivos del servidor, entorno o repositorio', async t => {
  const { url } = await instance(t);
  for (const path of ['/.env', '/server/claude.js', '/package.json', '/.git/config', '/%2e%2e/server/app.js', '/robots.txt']) assert.equal((await fetch(url + path)).status, 404);
});
test('configuración pública no contiene secretos y Claude queda apagado por defecto', async t => {
  const { url, post } = await instance(t);
  assert.deepEqual(await (await fetch(url + '/api/config')).json(), { aiAvailable: false });
  assert.equal((await post(input)).status, 503);
});
test('bloquea origen ajeno, ausente y sec-fetch-site cruzado', async t => {
  const { post } = await instance(t);
  for (const headers of [{ Origin: 'https://example.invalid' }, { Origin: '' }, { 'Sec-Fetch-Site': 'cross-site' }]) assert.equal((await post(input, headers)).status, 403);
});
test('bloquea hosts ajenos para evitar DNS rebinding', async t => {
  const { url } = await instance(t);
  const status = await new Promise((resolve, reject) => {
    const req = http.get(url, { headers: { host: 'example.invalid:3000' } }, response => { response.resume(); resolve(response.statusCode); });
    req.on('error', reject);
  });
  assert.equal(status, 403);
});
test('valida tamaño, tipo de contenido y sintaxis', async t => {
  const { post } = await instance(t);
  assert.equal((await post('x'.repeat(5000))).status, 413);
  assert.equal((await post('{')).status, 400);
  assert.equal((await post(input, { 'Content-Type': 'text/plain' })).status, 415);
});
test('limita cuerpo aunque se envíe por fragmentos sin content-length', async t => {
  const { url } = await instance(t);
  const status = await new Promise((resolve, reject) => {
    const req = http.request(url + '/api/assist', { method: 'POST', headers: { origin: url, 'content-type': 'application/json' } }, response => { response.resume(); resolve(response.statusCode); });
    req.on('error', reject);
    req.write('x'.repeat(4100)); req.end();
  });
  assert.equal(status, 413);
});
test('rechaza datos adicionales y ausencia de consentimiento antes del proveedor', async t => {
  let calls = 0;
  const { post } = await instance(t, { env, fetchImpl: async () => { calls += 1; } });
  for (const body of [{ ...input, description: 'privado' }, { ...input, locality: 'privado' }, { ...input, consent: false }, { ...input, category: '__proto__' }, null]) assert.equal((await post(body)).status, 400);
  assert.equal(calls, 0);
});
test('API solo acepta opciones como cadenas primitivas sin llamar al proveedor', async t => {
  let calls = 0;
  const { post } = await instance(t, { env, fetchImpl: async () => {
    calls += 1;
    return Response.json({ content: [{ type: 'text', text: sentence }] });
  } });
  for (const field of ['category', 'scope']) {
    const valid = input[field];
    for (const bad of [[valid], [[valid]], {}, { toString: valid }, null, 1, true]) {
      const response = await post({ ...input, [field]: bad });
      assert.equal(response.status, 400, `${field}: rechaza ${JSON.stringify(bad)}`);
    }
  }
  assert.equal(calls, 0);
});
test('adaptador llama solo al destino fijo con opciones mínimas y secreto en cabecera', async () => {
  const result = await suggestSentence(input, { env, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.anthropic.com/v1/messages');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers['x-api-key'], env.ANTHROPIC_API_KEY);
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'test-model');
    assert.deepEqual(JSON.parse(body.messages[0].content), { tipo: 'Falta o interrupción de agua', alcance: 'Varias viviendas o una comunidad' });
    assert.ok(!options.body.includes(env.ANTHROPIC_API_KEY));
    return Response.json({ content: [{ type: 'text', text: sentence }] });
  } });
  assert.equal(result, sentence);
});
test('fallos y errores del proveedor no filtran datos ni secretos al cliente', async t => {
  const { post } = await instance(t, { env, fetchImpl: async () => { throw new Error(env.ANTHROPIC_API_KEY); } });
  const response = await post(input);
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes(env.ANTHROPIC_API_KEY));
});
test('rechaza respuestas con enlaces, números, HTML, vacías o excesivas', async () => {
  for (const output of ['', 'x'.repeat(651), 'Contactar https://example.invalid para atención.', 'Contactar al número 123 para atención.', '<b>Solicito atención del problema descrito.</b>']) {
    await assert.rejects(suggestSentence(input, { env, fetchImpl: async () => Response.json({ content: [{ type: 'text', text: output }] }) }));
  }
});
test('fallo HTTP del proveedor no se presenta como éxito', async () => {
  await assert.rejects(suggestSentence(input, { env, fetchImpl: async () => new Response('provider error', { status: 429 }) }));
});
test('límite global de costo y recuperación después de la ventana', async t => {
  let time = 100000;
  const { post } = await instance(t, { env, now: () => time, fetchImpl: async () => Response.json({ content: [{ type: 'text', text: sentence }] }) });
  for (let i = 0; i < 6; i += 1) {
    const response = await post(input);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).reviewRequired, true);
  }
  assert.equal((await post(input)).status, 429);
  time += 60001;
  assert.equal((await post(input)).status, 200);
});
test('solo permite una petición al proveedor a la vez', async t => {
  let release;
  let started;
  const began = new Promise(resolve => { started = resolve; });
  const { post } = await instance(t, { env, fetchImpl: async () => { started(); await new Promise(resolve => { release = resolve; }); return Response.json({ content: [{ type: 'text', text: sentence }] }); } });
  const first = post(input);
  await began;
  assert.equal((await post(input)).status, 429);
  release();
  assert.equal((await first).status, 200);
});
