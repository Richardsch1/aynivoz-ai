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

const providerByteLimit = 32 * 1024;
function providerJsonBytes(size) {
  const payload = { stop_reason: 'end_turn', content: [{ type: 'text', text: sentence }], padding: '' };
  const remaining = size - Buffer.byteLength(JSON.stringify(payload));
  payload.padding = 'á'.repeat(Math.floor(remaining / 2)) + 'x'.repeat(remaining % 2);
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  assert.equal(bytes.byteLength, size);
  return bytes;
}
function providerStream(chunks, headers = {}) {
  const state = { pulls: 0, cancelled: false };
  const body = new ReadableStream({
    pull(controller) {
      const chunk = chunks[state.pulls++];
      if (chunk) controller.enqueue(chunk);
      else controller.close();
    },
    cancel() { state.cancelled = true; },
  }, { highWaterMark: 0 });
  return { response: new Response(body, { headers }), state };
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
    return Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: sentence }] });
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
    return Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: sentence }] });
  } });
  assert.equal(result, sentence);
});
test('rechaza finalizaciones incompletas o no admitidas del proveedor', async () => {
  for (const reason of ['max_tokens', 'stop_sequence', 'tool_use', 'pause_turn', 'refusal', null, undefined, 'unknown-test-reason']) {
    await assert.rejects(suggestSentence(input, {
      env, fetchImpl: async () => Response.json({ stop_reason: reason, content: [{ type: 'text', text: sentence }] }),
    }), { message: 'AI_UNSAFE_OUTPUT' }, `finalización: ${String(reason)}`);
  }
});
test('acepta varios bloques de texto y rechaza contenido malformado o no textual', async () => {
  const parts = ['Solicito que se verifique el problema descrito', 'y se informe la atención que corresponda.'];
  assert.equal(await suggestSentence(input, {
    env, fetchImpl: async () => Response.json({ stop_reason: 'end_turn', content: parts.map(text => ({ type: 'text', text })) }),
  }), parts.join(' '));
  const malformed = [
    [{ type: 'text', text: {} }], [{ type: 'text', text: [sentence] }],
    null, undefined, {}, 'texto', [], [null], ['texto'],
    [{ type: 'text', text: null }], [{ type: 'text', text: true }], [{ type: 'text', text: 42 }], [{ type: 'text' }],
    [{ type: 'text', text: sentence }, { type: 'tool_use', id: 'test-only-tool', name: 'test_only_tool', input: {} }],
    [{ type: 'thinking', thinking: 'EJEMPLO FICTICIO' }, { type: 'text', text: sentence }],
  ];
  for (const content of malformed) {
    await assert.rejects(suggestSentence(input, {
      env, fetchImpl: async () => Response.json({ stop_reason: 'end_turn', content }),
    }), { message: 'AI_UNSAFE_OUTPUT' });
  }
});
test('API descarta una respuesta truncada sin reintentar y admite la siguiente válida', async t => {
  let calls = 0;
  const partial = 'EJEMPLO FICTICIO. Solicito que se verifique el problema y que se';
  const { url, post } = await instance(t, { env, fetchImpl: async () => {
    calls += 1;
    return Response.json({ stop_reason: calls === 1 ? 'max_tokens' : 'end_turn', content: [{ type: 'text', text: calls === 1 ? partial : sentence }] });
  } });
  const rejected = await post(input);
  assert.equal(rejected.status, 502);
  assert.deepEqual(await rejected.json(), {
    error: 'No se pudo obtener una sugerencia segura. El borrador local sigue disponible.',
  });
  assert.equal(calls, 1);
  const localPage = await fetch(url);
  assert.equal(localPage.status, 200);
  assert.match(await localPage.text(), /id="report-form"/);
  const recovered = await post(input);
  assert.equal(recovered.status, 200);
  assert.deepEqual(await recovered.json(), { sentence, reviewRequired: true });
  assert.equal(calls, 2);
});
test('limita bytes del proveedor por cabecera o lectura y cancela antes del resto', async () => {
  const oversized = providerJsonBytes(providerByteLimit + 1);
  const chunks = [oversized.slice(0, providerByteLimit), oversized.slice(providerByteLimit), new Uint8Array([32])];
  for (const [headers, expectedPulls] of [
    [{ 'content-length': String(providerByteLimit + 1) }, 0],
    [{}, 2],
    [{ 'content-length': '10' }, 2],
  ]) {
    const { response, state } = providerStream(chunks, headers);
    await assert.rejects(suggestSentence(input, { env, fetchImpl: async () => response }), { message: 'AI_UNSAFE_OUTPUT' });
    assert.equal(state.pulls, expectedPulls);
    assert.equal(state.cancelled, true);
  }
});
test('conserva la aceptación de JSON con BOM UTF-8 inicial', async () => {
  const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), providerJsonBytes(512)]);
  const { response } = providerStream([bytes.subarray(0, 1), bytes.subarray(1)]);
  assert.equal(await suggestSentence(input, { env, fetchImpl: async () => response }), sentence);
});
test('acepta exactamente treinta y dos KiB con UTF-8 partido y rechaza un byte adicional', async () => {
  const exact = providerJsonBytes(providerByteLimit);
  const split = exact.indexOf(0xc3) + 1;
  assert.ok(split > 0);
  const valid = providerStream([exact.slice(0, split), exact.slice(split)]);
  assert.equal(await suggestSentence(input, { env, fetchImpl: async () => valid.response }), sentence);
  const oversized = new Uint8Array(providerByteLimit + 1);
  oversized.set(exact);
  oversized[providerByteLimit] = 32;
  assert.ok(new TextDecoder().decode(oversized).length < providerByteLimit);
  const invalid = providerStream([oversized.slice(0, split), oversized.slice(split)]);
  await assert.rejects(suggestSentence(input, { env, fetchImpl: async () => invalid.response }), { message: 'AI_UNSAFE_OUTPUT' });
  assert.equal(invalid.state.cancelled, true);
});
test('API descarta respuesta excesiva sin reintento y conserva recuperación y página local', async t => {
  let calls = 0;
  const oversized = providerJsonBytes(providerByteLimit + 1);
  const { url, post } = await instance(t, { env, fetchImpl: async () => {
    calls += 1;
    return calls === 1 ? providerStream([oversized]).response : Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: sentence }] });
  } });
  const rejected = await post(input);
  assert.equal(rejected.status, 502);
  assert.deepEqual(await rejected.json(), {
    error: 'No se pudo obtener una sugerencia segura. El borrador local sigue disponible.',
  });
  assert.equal(calls, 1);
  const localPage = await fetch(url);
  assert.equal(localPage.status, 200);
  assert.match(await localPage.text(), /id="report-form"/);
  const recovered = await post(input);
  assert.equal(recovered.status, 200);
  assert.deepEqual(await recovered.json(), { sentence, reviewRequired: true });
  assert.equal(calls, 2);
});
test('fallos y errores del proveedor no filtran datos ni secretos al cliente', async t => {
  const { post } = await instance(t, { env, fetchImpl: async () => { throw new Error(env.ANTHROPIC_API_KEY); } });
  const response = await post(input);
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes(env.ANTHROPIC_API_KEY));
});
test('rechaza respuestas con enlaces, números, HTML, vacías o excesivas', async () => {
  for (const output of ['', 'x'.repeat(651), 'Contactar https://example.invalid para atención.', 'Contactar al número 123 para atención.', '<b>Solicito atención del problema descrito.</b>']) {
    await assert.rejects(suggestSentence(input, { env, fetchImpl: async () => Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: output }] }) }));
  }
});
test('rechaza controles de presentación en cualquier posición de la sugerencia', async () => {
  const outputs = [
    `\u202a${sentence}`, `Solicito\u202b revisar el servicio de agua.`, `${sentence}\u202c`,
    `\u202d${sentence}`, `Solicito\u202e revisar el servicio de agua.`,
    `${sentence}\u2066`, `\u2067${sentence}`, `Solicito\u2068 revisar el servicio de agua.`,
    `${sentence}\u2069`, `Solicito\u007f revisar el servicio de agua.`,
  ];
  for (const output of outputs) {
    await assert.rejects(suggestSentence(input, {
      env, fetchImpl: async () => Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: output }] }),
    }), { message: 'AI_UNSAFE_OUTPUT' });
  }
});
test('rechazo de salida insegura no filtra la frase ni bloquea la siguiente solicitud', async t => {
  let calls = 0;
  const unsafe = 'EJEMPLO FICTICIO. Solicito\u202e revisar la atención de agua.';
  const { url, post } = await instance(t, { env, fetchImpl: async () => {
    calls += 1;
    return Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: calls === 1 ? unsafe : sentence }] });
  } });
  const rejected = await post(input);
  assert.equal(rejected.status, 502);
  assert.deepEqual(await rejected.json(), {
    error: 'No se pudo obtener una sugerencia segura. El borrador local sigue disponible.',
  });
  const localPage = await fetch(url);
  assert.equal(localPage.status, 200);
  assert.match(await localPage.text(), /id="report-form"/);
  const recovered = await post(input);
  assert.equal(recovered.status, 200);
  assert.deepEqual(await recovered.json(), { sentence, reviewRequired: true });
  assert.equal(calls, 2);
});
test('fallo HTTP del proveedor no se presenta como éxito', async () => {
  await assert.rejects(suggestSentence(input, { env, fetchImpl: async () => new Response('provider error', { status: 429 }) }));
});
test('límite global de costo y recuperación después de la ventana', async t => {
  let time = 100000;
  const { post } = await instance(t, { env, now: () => time, fetchImpl: async () => Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: sentence }] }) });
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
  const { post } = await instance(t, { env, fetchImpl: async () => { started(); await new Promise(resolve => { release = resolve; }); return Response.json({ stop_reason: 'end_turn', content: [{ type: 'text', text: sentence }] }); } });
  const first = post(input);
  await began;
  assert.equal((await post(input)).status, 429);
  release();
  assert.equal((await first).status, 200);
});
