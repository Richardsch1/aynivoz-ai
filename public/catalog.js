// Curated manually from primary official sources. Not a live directory or a nationwide routing engine.
export const VERIFIED_AT = '2026-10-27';
export const REVIEW_DAYS = 90;
export const CHANNELS = Object.freeze([
  {
    id: 'prestador', name: 'Tu prestador de agua y saneamiento', kind: 'Primer contacto',
    value: 'Consulta el canal que figura en tu recibo o confirma el prestador local.',
    scope: 'La competencia depende de tu localidad y del tipo de prestador. En zonas rurales, confirma con la JASS o municipalidad; no se incluye un directorio rural validado.',
    use: 'Reportar problemas operativos y solicitar atención. Confirma si corresponde un formato particular o de alcance general.',
    url: 'https://www.gob.pe/institucion/sunass/informes-publicaciones/4502284-formatos-para-presentar-un-reclamo-en-servicios-de-agua-potable-y-saneamiento',
    sourceTitle: 'SUNASS: formatos para presentar un reclamo en servicios de agua potable y saneamiento',
    evidence: 'La publicación incluye solicitudes de atención de problemas particulares y de alcance general.',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'sunass', name: 'Fono SUNASS', kind: 'Orientación nacional', value: '1899',
    scope: 'Perú. Orientación; confirmar el procedimiento para el prestador y la localidad.',
    use: 'Orientación sobre agua y alcantarillado e incidencias cuando el prestador no responde. SUNASS no repara directamente las instalaciones.',
    url: 'https://www.gob.pe/43281-direccion-de-usuarios-conoce-las-plataformas-de-atencion-y-orientacion-de-usuarios-de-la-sunass',
    sourceTitle: 'SUNASS: plataformas de atención y orientación de usuarios',
    evidence: 'La página oficial identifica la línea gratuita nacional 1899 y el rol de orientación y seguimiento del regulador.',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'sunass-operativo', name: 'WhatsApp de SUNASS', kind: 'Problema no atendido', value: '(01) 614 3180',
    scope: 'Problemas operativos no atendidos por el prestador; no es un canal general de facturación.',
    use: 'Reportar interrupciones, roturas, baja presión, atoros y aniegos que el prestador no ha atendido. Abre la fuente para confirmar el contacto.',
    url: 'https://www.gob.pe/institucion/sunass/contacto-y-numeros-de-emergencias',
    sourceTitle: 'SUNASS: contacto y números de atención',
    evidence: 'La ficha oficial señala WhatsApp para problemas operativos no atendidos por la EPS y muestra el número 1 614 3180.',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'sedapal', name: 'Sedapal · Aquafono', kind: 'Solo si Sedapal te atiende', value: '(01) 317 8000',
    scope: 'Únicamente usuarios dentro de la cobertura de Sedapal. Elegir Lima no basta para confirmar competencia.',
    use: 'Reportar falta de agua o problemas de alcantarillado. Revisa en la fuente qué información debes aportar directamente al prestador.',
    url: 'https://www.gob.pe/institucion/sedapal/pages/12786-llamar-a-sedapal-aquafono',
    sourceTitle: 'Sedapal: llamar a Aquafono',
    evidence: 'El servicio oficial publica (01) 3178000 para consultas y reportes de agua y alcantarillado.',
    verifiedAt: VERIFIED_AT,
  },
]);

export function catalogNeedsReview(now = new Date()) {
  const elapsed = now.getTime() - Date.parse(`${VERIFIED_AT}T00:00:00Z`);
  return !Number.isFinite(elapsed) || elapsed < 0 || elapsed > REVIEW_DAYS * 86400000;
}

export function channelsFor(provider) {
  return CHANNELS.filter(channel => channel.id !== 'sedapal' || provider === 'sedapal');
}
