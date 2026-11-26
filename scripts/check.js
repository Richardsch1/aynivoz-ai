import { lstat, readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { CHANNELS } from '../public/catalog.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const gitDirectory = path.join(root, '.git');
let hasOwnGit = false;
try { await lstat(gitDirectory); hasOwnGit = true; }
catch (error) {
  if (error.code !== 'ENOENT') throw new Error('No se pudo comprobar el índice de Git.');
}
if (hasOwnGit) {
  // Anchor this check to the normal index of this copy, including Gitfile worktrees.
  const redirects = new Set(['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE']);
  const gitEnvironment = Object.fromEntries(Object.entries(process.env).filter(([name]) => !redirects.has(name.toUpperCase())));
  const tracked = spawnSync('git', ['--git-dir', gitDirectory, '--work-tree', root, 'ls-files', '--cached', '-z'], {
    cwd: root, env: gitEnvironment, encoding: 'utf8', windowsHide: true, timeout: 5000,
  });
  if (tracked.error || tracked.status !== 0) throw new Error('No se pudo comprobar el índice de Git.');
  const privateEnvironment = tracked.stdout.split('\0').some(file => {
    const name = path.posix.basename(file);
    return name === '.env' || (name.startsWith('.env.') && name !== '.env.example');
  });
  if (privateEnvironment) throw new Error('No incluyas archivos de entorno privados en Git. Mantén .env local y usa .env.example como plantilla.');
} else {
  console.warn('No se comprobó el índice de Git: esta copia no contiene metadatos propios.');
}
let checked = 0;
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'coverage', '.env'].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) { await scan(full); continue; }
    if (entry.name.startsWith('.env.') && entry.name !== '.env.example') throw new Error('No incluyas archivos de entorno privados.');
    if (entry.name.endsWith('.js')) {
      const result = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8' });
      if (result.status !== 0) throw new Error(result.stderr);
    }
    const content = await readFile(full, 'utf8');
    if (/(?:sk-ant-[a-zA-Z0-9_-]{20,}|gh[pousr]_[a-zA-Z0-9]{25,}|github_pat_[a-zA-Z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/u.test(content)) throw new Error(`Posible secreto en ${entry.name}.`);
    if (/BEGIN (?:REAL CITIZEN|DATOS REALES)/u.test(content)) throw new Error('No publicar datos ciudadanos.');
    checked += 1;
  }
}
await scan(root);
for (const channel of CHANNELS) if (new URL(channel.url).hostname !== 'www.gob.pe') throw new Error('Revisar fuente no oficial.');
const client = await readFile(path.join(root, 'public/app.js'), 'utf8');
if (/innerHTML|localStorage|sessionStorage|indexedDB/u.test(client)) throw new Error('El cliente debe usar texto seguro y memoria efímera.');
console.info(`Verificados ${checked} archivos: sintaxis, patrones de secretos y fuentes del catálogo. No sustituye revisión humana.`);
