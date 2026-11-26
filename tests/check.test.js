import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const prefix = 'aynivoz-check-test-';
const environment = { ...process.env };
const gitRedirects = new Set(['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE']);
for (const key of Object.keys(environment)) if (gitRedirects.has(key.toUpperCase())) delete environment[key];
// This synthetic marker would fail the content scan if a private fixture were read.
const privateValue = ['BEGIN', 'DATOS REALES'].join(' ') + ': TEST_ONLY_FIXTURE';

async function copyMinimalProject(root) {
  await mkdir(path.join(root, 'scripts'), { recursive: true });
  await mkdir(path.join(root, 'public'), { recursive: true });
  for (const file of ['scripts/check.js', 'public/catalog.js']) {
    await copyFile(path.join(projectRoot, file), path.join(root, file));
  }
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ type: 'module' }));
  await writeFile(path.join(root, 'public/app.js'), 'export const testOnly = true;\n');
  await writeFile(path.join(root, '.gitignore'), '.env\n.env.*\n!.env.example\n');
}

function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, env: environment, encoding: 'utf8', windowsHide: true, timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

async function fixture(t, initializeGit = true) {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(async () => {
    const target = path.resolve(root);
    const relative = path.relative(path.resolve(os.tmpdir()), target);
    assert.ok(relative.startsWith(prefix) && !relative.includes(path.sep) && !path.isAbsolute(relative));
    await rm(target, { recursive: true, force: true });
  });
  await copyMinimalProject(root);
  if (initializeGit) git(root, ['init', '--quiet']);
  return root;
}

function check(root, extraEnvironment = {}) {
  return spawnSync(process.execPath, ['scripts/check.js'], {
    cwd: root, env: { ...environment, ...extraEnvironment }, encoding: 'utf8', windowsHide: true, timeout: 15000,
  });
}

test('check permite el entorno local ignorado y las plantillas versionadas sin leer el archivo privado', async t => {
  const root = await fixture(t);
  await writeFile(path.join(root, '.env'), privateValue);
  await writeFile(path.join(root, '.env.example'), 'TEST_ONLY_TEMPLATE=placeholder\n');
  await mkdir(path.join(root, 'zona ficticia'));
  await writeFile(path.join(root, 'zona ficticia/.env.example'), 'TEST_ONLY_TEMPLATE=placeholder\n');
  git(root, ['add', '--', '.env.example', 'zona ficticia/.env.example']);
  assert.equal(git(root, ['check-ignore', '.env']).trim(), '.env');
  const result = check(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Verificados/u);
  assert.ok(!(result.stdout + result.stderr).includes(privateValue));
});

test('check rechaza entornos privados del índice incluso si ya no están en disco y no copia su contenido', async t => {
  const root = await fixture(t);
  for (const [file, removeFromDisk] of [['.env', false], ['zona ficticia/.env', true], ['zona ficticia/.env.production', true]]) {
    const full = path.join(root, file);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, privateValue);
    git(root, ['add', '--force', '--', file]);
    if (removeFromDisk) await unlink(full);
    const result = check(root);
    const output = result.stdout + result.stderr;
    assert.notEqual(result.status, 0, file);
    assert.match(output, /No incluyas archivos de entorno privados/u);
    assert.ok(!output.includes(privateValue));
    git(root, ['rm', '--cached', '--force', '--', file]);
  }
  const clean = await fixture(t);
  git(clean, ['add', '--', 'package.json']);
  git(root, ['add', '--force', '--', '.env']);
  await unlink(path.join(root, '.env'));
  const redirected = check(root, {
    GIT_DIR: path.join(clean, '.git'), GIT_WORK_TREE: clean,
    GIT_COMMON_DIR: path.join(clean, '.git'), GIT_INDEX_FILE: path.join(clean, '.git/index'),
  });
  assert.notEqual(redirected.status, 0, 'comprueba el índice propio aunque el entorno apunte a otro limpio');
  assert.match(redirected.stdout + redirected.stderr, /No incluyas archivos de entorno privados/u);
  assert.ok(!(redirected.stdout + redirected.stderr).includes(privateValue));
});

test('check de una copia sin metadatos propios avisa y no hereda el índice del repositorio padre', async t => {
  const parent = await fixture(t);
  const root = path.join(parent, 'copia-zip');
  await copyMinimalProject(root);
  await writeFile(path.join(root, '.env'), privateValue);
  git(parent, ['add', '--force', '--', 'copia-zip/.env']);
  assert.equal(git(parent, ['ls-files', '--', 'copia-zip/.env']).trim(), 'copia-zip/.env');
  const result = check(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout + result.stderr, /No se comprobó el índice de Git: esta copia no contiene metadatos propios\./u);
  assert.ok(!(result.stdout + result.stderr).includes(privateValue));
});

test('check falla con metadatos Git propios inválidos sin exponer el diagnóstico interno', async t => {
  const parent = await fixture(t);
  for (const kind of ['directory', 'gitfile']) {
    const root = path.join(parent, kind);
    await copyMinimalProject(root);
    const marker = 'TEST_ONLY_PRIVATE_GIT_DETAIL';
    if (kind === 'directory') await mkdir(path.join(root, '.git'));
    else await writeFile(path.join(root, '.git'), `gitdir: ./${marker}\n`);
    const result = check(root);
    const output = result.stdout + result.stderr;
    assert.notEqual(result.status, 0, kind);
    assert.match(output, /No se pudo comprobar el índice de Git\./u);
    assert.ok(!output.includes(marker));
    assert.ok(!output.includes('fatal:'));
  }
});

test('check usa un Gitfile válido para permitir el entorno local y rechazarlo si queda en el índice', async t => {
  const parent = await fixture(t, false);
  const root = path.join(parent, 'proyecto');
  await copyMinimalProject(root);
  git(root, ['init', '--quiet', '--separate-git-dir', path.join(parent, 'metadata')]);
  assert.equal((await stat(path.join(root, '.git'))).isFile(), true);
  await writeFile(path.join(root, '.env'), privateValue);
  assert.equal(git(root, ['check-ignore', '.env']).trim(), '.env');
  const local = check(root);
  assert.equal(local.status, 0, local.stderr);
  git(root, ['add', '--force', '--', '.env']);
  await unlink(path.join(root, '.env'));
  const tracked = check(root);
  assert.notEqual(tracked.status, 0);
  assert.match(tracked.stdout + tracked.stderr, /No incluyas archivos de entorno privados/u);
  assert.ok(!(tracked.stdout + tracked.stderr).includes(privateValue));
});
