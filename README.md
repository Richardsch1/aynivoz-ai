# AyniVoz AI

Herramienta comunitaria de código abierto, en español, para organizar problemas de agua y saneamiento en Perú y preparar solicitudes que una persona revisa y presenta por un canal oficial.

**Estado: MVP local v0.1.0.** Funciona sin una API de IA. No hay pilotos comunitarios, usuarios activos, alianzas ni resultados de impacto verificados que se puedan atribuir a este proyecto. No es una plataforma oficial ni está afiliada a SUNASS, Sedapal o Anthropic.

## Ejecutarlo

Requiere [Node.js](https://nodejs.org/) 22 o 24. Sin dependencias de terceros en ejecución ni compilación.

```sh
git clone https://github.com/Richardsch1/aynivoz-ai.git
cd aynivoz-ai
npm ci --ignore-scripts
npm start
```

Abre **http://127.0.0.1:3000**. El servidor escucha exclusivamente en la interfaz local. Para detenerlo, usa Ctrl+C. Si el puerto está ocupado, configura `PORT` en un archivo `.env` local (ver `.env.example`).

1. Prueba el ejemplo ficticio o describe un problema sin información personal.
2. Confirma la revisión de privacidad y registra el reporte en la pestaña.
3. Edita el borrador y comprueba hechos, destinatario, requisitos y formato oficial.
4. Confirma la revisión humana y descarga el archivo `.txt`.
5. Consulta las fuentes del catálogo y presenta la solicitud tú, si corresponde.

La descarga no presenta un trámite. Ningún botón envía reportes a una autoridad. Recargar, salir o borrar elimina el reporte de la memoria de la página; los archivos descargados deben eliminarse desde el dispositivo.

## Qué incluye

- Falta de agua, baja presión, fugas, atoros/aniegos y cambios aparentes del agua.
- Registro efímero de un reporte por pestaña, sin cuentas ni base de datos.
- Borradores deterministas en español, editables, con revisión obligatoria antes de descargar.
- Catálogo manual de canales con fuente oficial, ámbito, uso, evidencia y fecha de verificación.
- Sedapal solo aparece cuando la persona confirma que es su prestador; no se deduce por distrito.
- Integración opcional con Claude desde el servidor, apagada por defecto y con consentimiento explícito.
- Pruebas de reglas, privacidad, API y límites; CI en Node 22 y 24.
- Interfaz adaptable, etiquetas accesibles, foco visible y navegación por teclado.

No incluye envío automático, seguimiento real de expedientes, mapas, reconocimiento de voz, adjuntos, identidad verificada, traducción a quechua/aimara ni un directorio nacional de prestadores. El nombre no implica funciones de voz disponibles.

## Privacidad y límites

No ingreses nombres, DNI, teléfonos, direcciones exactas, números de suministro, información de salud ni datos de otras personas. La detección de patrones bloquea algunos identificadores, correos, teléfonos y enlaces, pero **no garantiza detectar todos los datos personales**, nombres o ubicaciones precisas. La persona debe revisar el contenido.

La descripción y la zona no salen del navegador en el flujo del producto. No se usa almacenamiento persistente, telemetría, cookies, fuentes externas ni formularios remotos. El servidor no recibe reportes: solo entrega la interfaz y, si se habilita Claude, procesa dos opciones categóricas. El navegador, sistema operativo, extensiones y archivos descargados quedan fuera de esa garantía.

Si existe peligro inmediato, no esperes al borrador: busca un lugar seguro y contacta al servicio de emergencia o prestador competente por sus canales oficiales. La aplicación no diagnostica riesgos ni da asesoría legal o sanitaria.

## Claude opcional, solo desde servidor

Copia `.env.example` a `.env` en la raíz del proyecto. Mantén `.env` privado; nunca pegues claves en el navegador, commits, issues o capturas.

```dotenv
AI_ENABLED=false
ANTHROPIC_API_KEY=
CLAUDE_MODEL=
PORT=3000
```

Para habilitarlo, establece `AI_ENABLED=true`, proporciona una clave válida de tu cuenta y el identificador de un modelo disponible. Reinicia el servidor. **El uso de la API puede generar cargos** en esa cuenta; este repositorio no incluye créditos ni asume acceso a un modelo.

La persona debe autorizar cada interacción opcional. Se envían únicamente **tipo de problema y alcance** a Anthropic; se excluyen todos los textos libres, zona, prestador y borrador. Claude propone una frase, separada del borrador y marcada como no verificada. La persona decide si la incorpora manualmente. La respuesta del modelo no modifica el catálogo ni el destinatario.

El destino HTTPS de la API es fijo; hay tiempo máximo de espera, una petición simultánea y seis intentos por minuto para toda la instancia. Los fallos conservan el flujo local. No se han hecho llamadas con una clave real para validar este MVP: el adaptador se prueba con respuestas simuladas. Revisa las condiciones vigentes de tratamiento y retención de datos de Anthropic antes de habilitarlo. La minimización no significa ausencia de procesamiento externo.

Referencia técnica: [Messages API de Anthropic](https://platform.claude.com/docs/en/api/overview). El adaptador usa la versión estable `2023-06-01`, todavía documentada; el modelo se configura en servidor.

## Fuentes y cobertura

Revisión manual inicial: **27 de octubre de 2026**. El catálogo es orientativo y limitado; puede quedar desactualizado. La interfaz avisa tras 90 días y pide confirmar siempre en la fuente. No verifica disponibilidad en tiempo real.

| Canal o recurso | Ámbito y uso | Fuente primaria |
| --- | --- | --- |
| Prestador local | Primer contacto; confirmar competencia y formato. Directorio rural no implementado. | [SUNASS: formatos de solicitudes particulares y de alcance general](https://www.gob.pe/institucion/sunass/informes-publicaciones/4502284-formatos-para-presentar-un-reclamo-en-servicios-de-agua-potable-y-saneamiento) |
| Fono SUNASS 1899 | Orientación nacional; incidencias cuando el prestador no responde. | [SUNASS: plataformas de atención](https://www.gob.pe/43281-direccion-de-usuarios-conoce-las-plataformas-de-atencion-y-orientacion-de-usuarios-de-la-sunass) |
| WhatsApp SUNASS (01) 614 3180 | Problemas operativos no atendidos por el prestador. | [SUNASS: contacto oficial](https://www.gob.pe/institucion/sunass/contacto-y-numeros-de-emergencias) |
| Sedapal Aquafono (01) 317 8000 | Solo usuarios de Sedapal; falta de agua y alcantarillado. | [Sedapal: Aquafono](https://www.gob.pe/institucion/sedapal/pages/12786-llamar-a-sedapal-aquafono) |

La ruta no es idéntica para problemas particulares y comunitarios. El MVP no decide el procedimiento aplicable ni calcula plazos. SUNASS orienta y supervisa; no ejecuta directamente reparaciones. La orientación sobre JASS/municipalidad es una indicación de **confirmar**, no una derivación verificada. Más detalle en [fuentes y mantenimiento](docs/FUENTES.md).

## Desarrollo y pruebas

```sh
npm run check
npm test
npm audit --omit=dev --audit-level=high
```

CI ejecuta estas comprobaciones tras cada push o pull request. Las pruebas no contactan a Anthropic ni a entidades públicas. El escáner de patrones de secretos es preventivo, limitado y no certifica la ausencia de secretos o datos personales. Consulta [la arquitectura](docs/ARQUITECTURA.md), [seguridad y privacidad](docs/SEGURIDAD-PRIVACIDAD.md) y [el plan de validación comunitaria](docs/VALIDACION.md).

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) y [SECURITY.md](SECURITY.md). Usa únicamente datos ficticios en pruebas, capturas e issues. Las mejoras de canales requieren fuente oficial y revisión de ámbito; no se aceptan contactos inventados o atribuciones de competencia sin evidencia.

## Licencia y Claude for OSS

Código bajo [MIT](LICENSE), una [licencia aprobada por la OSI](https://opensource.org/license/mit). Las fuentes oficiales enlazadas pertenecen a sus respectivos titulares; no se reproducen formularios ni se usan sus logotipos.

**Crear o publicar este repositorio no garantiza elegibilidad para [Claude for Open Source](https://claude.com/contact-sales/claude-for-oss).** La selección y condiciones dependen de Anthropic y pueden cambiar. No se afirma aceptación, patrocinio, métricas de uso, descargas, contribuidores externos ni actividad comunitaria inexistente. Claude for OSS y las iniciativas para startups son programas distintos. Cualquier futura postulación debe describir con honestidad el estado y la actividad verificable del proyecto.
