import { validateReport, createDraft, aiPayload, assertReviewedDraft } from './domain.js';
import { channelsFor, catalogNeedsReview, VERIFIED_AT } from './catalog.js';

const $ = id => document.getElementById(id);
let report = null;
let aiAvailable = false;
let pending = false;
let revision = 0;
let controller = null;

function invalidate() {
  revision += 1;
  controller?.abort();
  pending = false;
  report = null;
  $('draft').value = '';
  $('draft-section').hidden = true;
  $('reviewed').checked = false;
  $('download').disabled = true;
  $('ai-consent').checked = false;
  $('ai-result').textContent = '';
  updateAiButton();
}

function renderChannels() {
  const list = $('channel-list');
  list.replaceChildren();
  for (const channel of channelsFor($('provider').value)) {
    const article = document.createElement('article');
    article.className = 'channel';
    for (const [tag, className, value] of [['p', 'kind', channel.kind], ['h3', '', channel.name], ['p', 'value', channel.value], ['p', '', channel.use], ['p', '', channel.scope]]) {
      const element = document.createElement(tag);
      element.className = className;
      element.textContent = value;
      article.append(element);
    }
    const link = document.createElement('a');
    link.href = channel.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Consultar fuente oficial';
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Verificación y límites';
    const evidence = document.createElement('p');
    evidence.textContent = `${channel.sourceTitle}. ${channel.evidence} Verificado: ${channel.verifiedAt}. La disponibilidad puede cambiar; confirma en la fuente.`;
    details.append(summary, evidence);
    article.append(link, details);
    list.append(article);
  }
  $('catalog-status').textContent = `Fuentes oficiales revisadas el ${VERIFIED_AT}. ${catalogNeedsReview() ? 'La revisión del catálogo está vencida o la fecha no es válida: confirma todos los datos en la fuente.' : 'Revisión manual recomendada cada 90 días; confirma siempre la vigencia en la fuente.'}`;
}

function updateAiButton() { $('ask-ai').disabled = !aiAvailable || !report || !$('ai-consent').checked || pending; }

$('report-form').addEventListener('input', () => { invalidate(); $('message').textContent = ''; renderChannels(); });
$('report-form').addEventListener('submit', event => {
  event.preventDefault();
  try {
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const checked = $('privacy').checked;
    const safe = validateReport({ ...form, privacy: checked });
    invalidate();
    report = safe;
    $('draft').value = createDraft(report);
    $('draft-section').hidden = false;
    $('message').textContent = 'Reporte registrado en esta pestaña. El borrador está listo para revisar más abajo.';
    $('draft-section').scrollIntoView({ block: 'start' });
    $('draft').focus({ preventScroll: true });
    updateAiButton();
  } catch (error) { $('message').textContent = error.message; }
});
$('demo').addEventListener('click', () => {
  invalidate();
  $('category').value = 'sin-agua';
  $('scope').value = 'comunidad';
  $('provider').value = 'desconocido';
  $('locality').value = 'Distrito de prueba (ficticio)';
  $('description').value = 'EJEMPLO FICTICIO. Varias viviendas de la zona reportan una interrupción de agua. No se ha confirmado la causa ni el alcance. Se solicita una verificación del servicio.';
  $('privacy').checked = false;
  $('message').textContent = 'Ejemplo ficticio cargado. Revisa la privacidad y registra para preparar el borrador.';
  renderChannels();
});
$('erase').addEventListener('click', () => {
  invalidate();
  $('report-form').reset();
  $('message').textContent = 'Se borró el contenido de esta pestaña. Los archivos ya descargados se eliminan desde tu dispositivo.';
  renderChannels();
});
$('draft').addEventListener('input', () => { $('reviewed').checked = false; $('download').disabled = true; });
$('reviewed').addEventListener('change', () => { $('download').disabled = !$('reviewed').checked; });
$('download').addEventListener('click', () => {
  try {
    const content = assertReviewedDraft($('draft').value, $('reviewed').checked);
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aynivoz-borrador-revisado.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('message').textContent = 'Descarga iniciada. La solicitud no ha sido presentada.';
  } catch (error) { $('message').textContent = error.message; }
});
$('ai-consent').addEventListener('change', () => {
  if (!$('ai-consent').checked) { revision += 1; controller?.abort(); pending = false; $('ai-result').textContent = ''; }
  updateAiButton();
});
$('ask-ai').addEventListener('click', async () => {
  const currentRevision = revision;
  const localController = new AbortController();
  controller = localController;
  pending = true;
  updateAiButton();
  $('ai-result').textContent = 'Solicitando una frase con las dos opciones autorizadas…';
  try {
    const response = await fetch('/api/assist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aiPayload(report, $('ai-consent').checked)), signal: localController.signal,
    });
    const payload = await response.json();
    if (currentRevision !== revision) return;
    if (!response.ok) throw new Error(payload.error || 'Usa el borrador local.');
    $('ai-result').textContent = `Sugerencia sin verificar: ${payload.sentence}`;
  } catch (error) {
    if (currentRevision === revision && error.name !== 'AbortError') $('ai-result').textContent = 'No se pudo obtener la sugerencia. Puedes continuar con el borrador local.';
  } finally {
    if (currentRevision === revision) { pending = false; updateAiButton(); }
  }
});
// Clear on navigation, including back/forward cache; no persistence APIs are used.
window.addEventListener('pagehide', () => { invalidate(); $('report-form').reset(); });
renderChannels();
fetch('/api/config').then(response => response.json()).then(config => {
  aiAvailable = config.aiAvailable === true;
  $('ai-status').textContent = aiAvailable ? 'Claude está habilitado en el servidor. Su uso es opcional.' : 'Claude está desactivado. Todo el flujo principal funciona con una plantilla local, sin IA.';
  updateAiButton();
}).catch(() => { $('ai-status').textContent = 'No se pudo consultar Claude. El borrador local está disponible.'; });
