import { createApp } from './app.js';

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT debe estar entre 1024 y 65535.');
const server = createApp();
server.listen(port, '127.0.0.1', () => console.info(`AyniVoz AI: http://127.0.0.1:${port} — MVP local`));
server.on('error', () => { console.error('No se pudo iniciar. Revisa si el puerto está ocupado.'); process.exitCode = 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
