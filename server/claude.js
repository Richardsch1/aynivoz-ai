import { CATEGORIES, SCOPES, ValidationError, containsSensitivePattern } from '../public/domain.js';

export function validateAiRequest(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).sort().join(',') !== 'category,consent,scope') throw new ValidationError('Solo se aceptan tipo, alcance y consentimiento.');
  if (raw.consent !== true || typeof raw.category !== 'string' || typeof raw.scope !== 'string' || !Object.hasOwn(CATEGORIES, raw.category) || !Object.hasOwn(SCOPES, raw.scope)) throw new ValidationError('Confirma el consentimiento y las opciones del reporte.');
  return { category: raw.category, scope: raw.scope };
}

export function claudeConfigured(env) {
  return env.AI_ENABLED === 'true' && Boolean(env.ANTHROPIC_API_KEY?.trim()) && Boolean(env.CLAUDE_MODEL?.trim());
}

export async function suggestSentence(input, { env = process.env, fetchImpl = fetch } = {}) {
  const safe = validateAiRequest(input);
  if (!claudeConfigured(env)) throw new Error('AI_UNAVAILABLE');
  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(12000),
    headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: env.CLAUDE_MODEL, max_tokens: 200,
      system: 'Redacta una sola frase breve en español para solicitar verificación y atención de un problema de agua o saneamiento. Usa lenguaje respetuoso y condicional. No inventes hechos, fechas, cantidades, diagnósticos, leyes, plazos, autoridades, contactos, enlaces ni resultados. No des instrucciones de salud. Devuelve únicamente la frase, sin formato.',
      messages: [{ role: 'user', content: JSON.stringify({ tipo: CATEGORIES[safe.category], alcance: SCOPES[safe.scope] }) }],
    }),
  });
  // Never propagate provider errors: they may contain request data or credentials.
  if (!response.ok) throw new Error('AI_UNAVAILABLE');
  const payload = await response.json();
  const sentence = payload.content?.filter(block => block.type === 'text').map(block => block.text).join(' ').trim();
  if (typeof sentence !== 'string' || sentence.length < 15 || sentence.length > 650 || /[<>\d\u0000-\u001f]/u.test(sentence) || containsSensitivePattern(sentence)) throw new Error('AI_UNSAFE_OUTPUT');
  return sentence;
}
