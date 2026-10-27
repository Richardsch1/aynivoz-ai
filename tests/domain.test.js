import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReport, createDraft, aiPayload, assertReviewedDraft } from '../public/domain.js';
import { CHANNELS, channelsFor, catalogNeedsReview } from '../public/catalog.js';

const example = { category: 'sin-agua', scope: 'comunidad', provider: 'desconocido', locality: 'Distrito ficticio', description: 'EJEMPLO FICTICIO. Se observa falta de agua en varias viviendas de la zona.', privacy: true };

test('registra únicamente campos autorizados y normaliza el texto', () => {
  const result = validateReport({ ...example, locality: '  Distrito ficticio  ', unexpected: 'ignored' });
  assert.equal(result.locality, 'Distrito ficticio');
  assert.equal(result.unexpected, undefined);
  assert.equal(result.privacy, undefined);
});
test('exige confirmación de privacidad', () => assert.throws(() => validateReport({ ...example, privacy: false })));
test('rechaza categorías, alcance y proveedor desconocidos', () => {
  for (const field of ['category', 'scope', 'provider']) {
    for (const bad of ['inventado', '__proto__', 'toString', null]) assert.throws(() => validateReport({ ...example, [field]: bad }));
  }
});
test('valida límites y tipos', () => {
  for (const description of [null, 'breve', 'x'.repeat(1201)]) assert.throws(() => validateReport({ ...example, description }));
  for (const locality of [undefined, 'x', 'x'.repeat(81)]) assert.throws(() => validateReport({ ...example, locality }));
});
test('rechaza patrones obvios de datos sensibles, enlaces, HTML y controles', () => {
  for (const detail of ['DNI 00000000', 'correo persona@example.invalid', 'teléfono +51 000 000 000', 'sitio https://example.invalid', '<script>alert(1)</script>', 'texto\u202eoculto', 'texto\u0000nulo']) {
    assert.throws(() => validateReport({ ...example, description: `EJEMPLO FICTICIO: ${detail}. Se observa falta de agua.` }));
  }
});
test('borrador refleja hechos como no verificados y no inventa autoridad', () => {
  const draft = createDraft(example);
  assert.match(draft, /BORRADOR PARA REVISIÓN — NO PRESENTADO/);
  assert.match(draft, /sin verificación independiente/);
  assert.match(draft, /Prestador competente: confirmar/);
  assert.ok(draft.includes(example.description));
  assert.ok(!draft.includes('Sedapal'));
});
test('Sedapal requiere selección expresa', () => {
  assert.match(createDraft({ ...example, provider: 'sedapal' }), /Sedapal/);
  assert.ok(!channelsFor('desconocido').some(c => c.id === 'sedapal'));
  assert.ok(channelsFor('sedapal').some(c => c.id === 'sedapal'));
});
test('descarga exige revisión humana y texto válido', () => {
  assert.throws(() => assertReviewedDraft(createDraft(example), false));
  assert.throws(() => assertReviewedDraft('', true));
  assert.equal(assertReviewedDraft(createDraft(example), true), createDraft(example));
});
test('proyección de IA excluye texto, ubicación y prestador', () => {
  assert.deepEqual(aiPayload(example, true), { category: 'sin-agua', scope: 'comunidad', consent: true });
  assert.throws(() => aiPayload(example, false));
});
test('catálogo tiene fuentes oficiales, evidencia, ámbito y fecha', () => {
  assert.equal(new Set(CHANNELS.map(c => c.id)).size, CHANNELS.length);
  for (const channel of CHANNELS) {
    assert.equal(new URL(channel.url).protocol, 'https:');
    assert.equal(new URL(channel.url).hostname, 'www.gob.pe');
    for (const field of ['name', 'scope', 'use', 'sourceTitle', 'evidence', 'verifiedAt']) assert.ok(channel[field]);
  }
});
test('catálogo alerta por antigüedad o fecha inválida', () => {
  assert.equal(catalogNeedsReview(new Date('2026-10-27T12:00:00Z')), false);
  assert.equal(catalogNeedsReview(new Date('2027-02-01T00:00:00Z')), true);
  assert.equal(catalogNeedsReview(new Date('invalid')), true);
  assert.equal(catalogNeedsReview(new Date('2020-01-01')), true);
});
