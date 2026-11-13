import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReport, createDraft, aiPayload, assertReviewedDraft, ValidationError } from '../public/domain.js';
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
test('reporte solo acepta opciones como cadenas primitivas', () => {
  for (const field of ['category', 'scope', 'provider']) {
    const valid = example[field];
    for (const bad of [[valid], [[valid]], new String(valid), { toString: () => valid }, {}, null, undefined, 1, true]) {
      assert.throws(() => validateReport({ ...example, [field]: bad }), ValidationError, `${field}: rechaza ${Object.prototype.toString.call(bad)}`);
    }
  }
});
test('valida límites y tipos', () => {
  for (const description of [null, 'breve', 'x'.repeat(1201)]) assert.throws(() => validateReport({ ...example, description }));
  for (const locality of [undefined, 'x', 'x'.repeat(81)]) assert.throws(() => validateReport({ ...example, locality }));
});
test('errores de validación del reporte identifican el campo que debe revisarse', () => {
  const cases = [
    ['category', 'inventado'], ['scope', ['comunidad']], ['provider', 'inventado'], ['privacy', false],
    ['locality', null], ['locality', 'x'], ['locality', '<zona ficticia>'],
    ['description', null], ['description', 'breve'], ['description', 'EJEMPLO FICTICIO. Texto\u202e oculto para probar la validación.'],
  ];
  for (const [field, value] of cases) {
    assert.throws(() => validateReport({ ...example, [field]: value }),
      error => error instanceof ValidationError && error.field === field, field);
  }
});
test('patrones sensibles identifican zona o descripción sin copiar su contenido al error', () => {
  for (const field of ['locality', 'description']) {
    const value = 'EJEMPLO FICTICIO. Correo persona@example.invalid para consultar.';
    assert.throws(() => validateReport({ ...example, [field]: value }), error => {
      assert.ok(error instanceof ValidationError);
      assert.equal(error.field, field);
      assert.match(error.message, /Elimina.*correos/);
      assert.ok(!error.message.includes('persona@example.invalid'));
      return true;
    });
  }
});
test('patrón repartido entre zona y descripción sigue rechazado sin atribuirlo a un campo', () => {
  assert.throws(() => validateReport({
    ...example, locality: 'Zona ficticia 000', description: '0000: EJEMPLO FICTICIO. Se observa una interrupción de agua.',
  }), error => {
    assert.ok(error instanceof ValidationError);
    assert.match(error.message, /Elimina números de identificación/);
    assert.equal(error.field, undefined);
    return true;
  });
});
test('rechaza decimales Unicode en patrones sensibles sin ampliar las restricciones del reporte', () => {
  const zeros = ['\uff10', '\u0660', '\u06f0', '\u0966', '\u{1d7ce}'];
  for (const zero of zeros) {
    const details = [
      zero.repeat(7), Array(7).fill(zero).join(' - '), `0${zero}0${zero}0${zero}0`,
      ...['DNI', 'pasaporte', 'RUC'].map(label => `${label} ${zero}`),
    ];
    for (const field of ['locality', 'description']) {
      for (const detail of details) {
        const value = `EJEMPLO FICTICIO. ${detail}`;
        assert.throws(() => validateReport({ ...example, [field]: value }), error => {
          assert.ok(error instanceof ValidationError);
          assert.equal(error.field, field);
          assert.match(error.message, /Elimina/);
          assert.ok(!error.message.includes(zero));
          return true;
        }, `${field}: ${JSON.stringify(detail)}`);
      }
    }
    assert.throws(() => validateReport({
      ...example, locality: `Zona ficticia ${zero.repeat(3)}`,
      description: `${zero.repeat(4)}: EJEMPLO FICTICIO. Se observa falta de agua.`,
    }), error => {
      assert.ok(error instanceof ValidationError);
      assert.equal(error.field, undefined);
      assert.match(error.message, /Elimina/);
      assert.ok(!error.message.includes(zero));
      return true;
    });
    const positive = {
      ...example, locality: `Zona ficticia ${zero.repeat(2)}`,
      description: 'EJEMPLO FICTICIO. La presión del agua varía y se solicita revisar el servicio.',
    };
    assert.equal(validateReport(positive).locality, positive.locality);
    assert.equal(validateReport(positive).description, positive.description);
  }
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
test('proyección de IA solo acepta opciones como cadenas primitivas', () => {
  for (const field of ['category', 'scope']) {
    const valid = example[field];
    for (const bad of [[valid], [[valid]], new String(valid), { toString: () => valid }, {}, null, undefined, 1, true]) {
      assert.throws(() => aiPayload({ ...example, [field]: bad }, true), ValidationError, `${field}: rechaza ${Object.prototype.toString.call(bad)}`);
    }
  }
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
