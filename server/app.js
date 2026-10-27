import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { claudeConfigured, suggestSentence, validateAiRequest } from './claude.js';
import { ValidationError } from '../public/domain.js';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/domain.js', ['domain.js', 'text/javascript; charset=utf-8']],
  ['/catalog.js', ['catalog.js', 'text/javascript; charset=utf-8']],
]);

export function createApp({ env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  let windowStart = 0;
  let used = 0;
  let active = 0;
  const server = createServer(async (req, res) => {
    const headers = {
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY', 'Cache-Control': 'no-store',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
    const send = (status, body, type = 'application/json; charset=utf-8') => {
      res.writeHead(status, { ...headers, 'Content-Type': type });
      res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
    };
    // Bind serving to loopback hosts as well as the loopback listen address (DNS rebinding defense).
    if (!/^(?:127\.0\.0\.1|localhost):\d{1,5}$/.test(req.headers.host || '')) return send(403, { error: 'Host no permitido.' });
    const path = (req.url || '/').split('?')[0];
    try {
      if (req.method === 'GET' && assets.has(path)) {
        const [file, type] = assets.get(path);
        return send(200, await readFile(new URL(`../public/${file}`, import.meta.url)), type);
      }
      if (req.method === 'GET' && path === '/api/config') return send(200, { aiAvailable: claudeConfigured(env) });
      if (req.method === 'POST' && path === '/api/assist') {
        const origin = `http://${req.headers.host}`;
        if (req.headers.origin !== origin || (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin')) return send(403, { error: 'Origen no permitido.' });
        if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') return send(415, { error: 'Usa JSON.' });
        if (Number(req.headers['content-length']) > 4096) return send(413, { error: 'Solicitud demasiado grande.' });
        let body = '';
        let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 4096) return send(413, { error: 'Solicitud demasiado grande.' });
          body += chunk.toString('utf8');
        }
        let data;
        try { data = JSON.parse(body); } catch { return send(400, { error: 'JSON inválido.' }); }
        validateAiRequest(data);
        if (!claudeConfigured(env)) return send(503, { error: 'Claude no está habilitado. Puedes usar el borrador local.' });
        if (now() - windowStart >= 60000) { windowStart = now(); used = 0; }
        if (used >= 6 || active >= 1) return send(429, { error: 'Límite temporal alcanzado. Usa el borrador local o espera un minuto.' });
        used += 1;
        active += 1;
        try {
          return send(200, { sentence: await suggestSentence(data, { env, fetchImpl }), reviewRequired: true });
        } catch {
          return send(502, { error: 'No se pudo obtener una sugerencia segura. El borrador local sigue disponible.' });
        } finally { active -= 1; }
      }
      return send(404, { error: 'Ruta no disponible.' });
    } catch (error) {
      return send(error instanceof ValidationError ? 400 : 500, { error: error instanceof ValidationError ? error.message : 'No se pudo completar la solicitud.' });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.maxHeadersCount = 40;
  return server;
}
