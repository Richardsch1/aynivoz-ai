export const CATEGORIES = Object.freeze({
  'sin-agua': 'Falta o interrupción de agua',
  'baja-presion': 'Baja presión de agua',
  'fuga': 'Fuga o rotura de tubería',
  'desague': 'Atoro o aniego de desagüe',
  'calidad': 'Cambio aparente en el agua',
});
export const SCOPES = Object.freeze({ hogar: 'Una vivienda', comunidad: 'Varias viviendas o una comunidad' });
export const PROVIDERS = Object.freeze({ desconocido: 'Por confirmar', sedapal: 'Sedapal (confirmado por la persona)', otro: 'Otro prestador / JASS / municipalidad (por confirmar)' });

export class ValidationError extends Error {}

export function text(value, label, min, max) {
  if (typeof value !== 'string') throw new ValidationError(`${label}: ingresa texto.`);
  const cleaned = value.normalize('NFC').trim();
  if (cleaned.length < min || cleaned.length > max) throw new ValidationError(`${label}: usa entre ${min} y ${max} caracteres.`);
  if (/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069<>]/u.test(cleaned)) throw new ValidationError(`${label}: elimina etiquetas o caracteres de control.`);
  return cleaned;
}

export function containsSensitivePattern(value) {
  return /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\d[\s().+-]*){7,}|\b(?:dni|pasaporte|ruc)\s*[:#]?\s*\d|https?:\/\/|www\./iu.test(value);
}

export function validateReport(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new ValidationError('Revisa el reporte.');
  for (const [field, allowed] of [['category', CATEGORIES], ['scope', SCOPES], ['provider', PROVIDERS]]) {
    if (!Object.hasOwn(allowed, raw[field])) throw new ValidationError('Selecciona un tipo, alcance y prestador válidos.');
  }
  if (raw.privacy !== true) throw new ValidationError('Confirma que revisaste la privacidad.');
  const locality = text(raw.locality, 'Distrito o zona general', 2, 80);
  const description = text(raw.description, 'Descripción', 20, 1200);
  if (containsSensitivePattern(`${locality} ${description}`)) throw new ValidationError('Elimina números de identificación, teléfonos, correos y enlaces. Añade datos personales solo en el canal oficial.');
  // Allowlist: do not propagate extra keys, attachments, identifiers or precise coordinates.
  return { category: raw.category, scope: raw.scope, provider: raw.provider, locality, description };
}

export function createDraft(raw) {
  const report = validateReport({ ...raw, privacy: true });
  const recipient = report.provider === 'sedapal' ? 'Sedapal, previa confirmación de cobertura' : '[Prestador competente: confirmar antes de presentar]';
  return `BORRADOR PARA REVISIÓN — NO PRESENTADO\n\nA: ${recipient}\nAsunto: Solicitud de atención por ${CATEGORIES[report.category].toLowerCase()}\nZona general: ${report.locality}\nAlcance reportado: ${SCOPES[report.scope]}\n\nHechos descritos por la persona (sin verificación independiente):\n${report.description}\n\nSolicito que se verifique el problema descrito, se me informe la atención que corresponda y se me facilite una constancia o número de seguimiento por el canal oficial.\n\n[Completar fecha, identidad y datos de contacto únicamente al presentar por el canal oficial.]\n[Revisar hechos, destinatario, requisitos y formato oficial aplicable.]\n\nEste texto es una ayuda de redacción. No acredita hechos, no es un formulario oficial y no asegura una respuesta ni sustituye orientación profesional. AyniVoz AI no ha enviado esta solicitud.`;
}

export function aiPayload(report, consent) {
  if (consent !== true) throw new ValidationError('Autoriza el uso opcional de Claude.');
  if (!report || !Object.hasOwn(CATEGORIES, report.category) || !Object.hasOwn(SCOPES, report.scope)) throw new ValidationError('Registra primero un reporte válido.');
  // Deliberately omit ALL free text, locality, provider, dates and citizen details.
  return { category: report.category, scope: report.scope, consent: true };
}

export function assertReviewedDraft(draft, reviewed) {
  if (reviewed !== true) throw new ValidationError('Revisa el borrador y confirma la revisión antes de descargar.');
  return text(draft, 'Borrador', 20, 8000);
}
