# Registro de mantenimiento

Este registro describe cambios y comprobaciones realmente realizados. No representa uso comunitario ni resultados de impacto.

## 2026-11-06 · Validación de respuestas completas y textuales

**Problema reproducido:** una respuesta simulada con `stop_reason: "max_tokens"` y una frase cortada se aceptaba como sugerencia. Un bloque cuyo valor `text` era un objeto vacío también se convertía a `[object Object]` y superaba el filtro de longitud. No se observó un incidente con usuarios ni se hicieron llamadas reales a Claude.

**Cambio:** antes de unir los bloques, el adaptador exige finalización normal (`end_turn`) y una lista no vacía de bloques de texto con valores de tipo cadena. Rechaza truncamientos, motivos ausentes o no admitidos y contenido de otros tipos. No procesa herramientas ni razonamiento. Mantiene los filtros de salida, la revisión humana y el error HTTP 502 genérico, sin devolver la frase rechazada ni hacer reintentos automáticos. El borrador local sigue disponible.

**Fuente técnica:** [motivos de finalización de la API de Anthropic](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons), consultada el 6 de noviembre de 2026. El fin normal no garantiza que una frase sea correcta o apropiada.

**Verificación local:** Windows, Node v24.12.0. Con las simulaciones actualizadas, las 17 pruebas previas de servidor pasaron y las tres regresiones nuevas fallaron antes de corregir el adaptador. Después del cambio, la suite completa aprobó 36 de 36 pruebas. Se comprobaron motivos ausentes o no admitidos, bloques malformados, aceptación de varios bloques de texto válidos y recuperación HTTP 502 → 200 sin reintentos automáticos ni devolución de la frase rechazada. `npm run check` y `git diff --check` terminaron sin errores; `npm audit --omit=dev --audit-level=high` no reportó vulnerabilidades. Las respuestas fueron simuladas, sin clave real de Anthropic ni datos de ciudadanos. No se hizo una nueva prueba de navegador en esta revisión.

El resultado remoto de este cambio debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); las comprobaciones locales no confirman por sí solas CI en Node 22 y 24.

**Próximos pasos:** continuar las comprobaciones de accesibilidad con lectores de pantalla y otros navegadores, y evaluar mensajes asociados a campos concretos. El adaptador continúa sin validación con una clave o modelo real; esa prueba requiere consentimiento y presupuesto propios, como se indica en el README. No se atribuye uso ni impacto comunitario validado.

## 2026-11-01 · Foco y recuperación de errores del reporte

**Problema reproducido:** en Chrome, al registrar con Enter un reporte ficticio que contenía un correo de prueba, la validación local mostraba un mensaje pero el foco permanecía en el botón de registro. No había un enlace desde el mensaje para volver a los campos.

**Cambio:** los errores detectados por la validación local al registrar aparecen en un resumen antes del formulario, con título, descripción, foco visible y enlace de regreso. No se borran los campos al mostrar el error. Editar, cargar el ejemplo o borrar limpia el resumen; un reporte válido conserva el foco en el borrador y la revisión obligatoria antes de descargar. La validación nativa de campos obligatorios se mantiene.

**Verificación local:** Windows, Node v24.12.0. Las pruebas nuevas reprodujeron dos fallos con el cliente anterior; la suite completa aprobó 33 de 33 pruebas después del cambio. Las tres pruebas de cliente usan eventos y un DOM mínimos simulados, validaciones reales y configuración de IA simulada; no sustituyen un navegador. `npm run check` y `git diff --check` terminaron sin errores; `npm audit --omit=dev --audit-level=high` no reportó vulnerabilidades.

**Comprobación en Chrome:** con datos ficticios y Claude desactivado, el error recibió foco y contorno visible, sin borrar los campos; Tab llegó al enlace y Enter enfocó el primer selector. Corregir el texto ocultó el resumen, y el registro válido enfocó el borrador con descarga bloqueada hasta revisar. Editar el borrador volvió a bloquear la descarga. Se verificaron el borrado y la validación nativa de campos obligatorios. No se hizo una prueba con lector de pantalla, otros navegadores ni un guardado de archivo en esta revisión.

El resultado de CI para este cambio debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); los resultados locales no confirman por sí solos las ejecuciones remotas en Node 22 y 24.

**Referencia de diseño:** [notificaciones de formularios de W3C WAI](https://www.w3.org/WAI/tutorials/forms/notifications/). Esta mejora puntual no acredita una auditoría de accesibilidad ni conformidad con WCAG.

**Próximos pasos:** comprobar el comportamiento con lectores de pantalla y otros navegadores, y evaluar mensajes asociados a campos concretos. No se han realizado pruebas con comunidades ni se atribuye impacto validado.

## 2026-10-29 · Rechazo de controles en sugerencias de IA

**Problema reproducido:** una respuesta simulada con controles bidireccionales explícitos o DEL era aceptada por el adaptador de Claude y devuelta como sugerencia. Esos caracteres ya se rechazaban en el texto local. Los controles de dirección pueden cambiar la presentación visual del texto que una persona revisa.

**Cambio:** el filtro de salida del adaptador ahora rechaza U+202A–U+202E, U+2066–U+2069 y DEL. La API descarta la frase completa y conserva su error genérico HTTP 502. Se mantienen el flujo local, el consentimiento opcional y la revisión humana; el filtro no pretende detectar todos los caracteres invisibles ni certificar el contenido.

**Verificación local:** Windows, Node v24.12.0. Las dos pruebas nuevas fallaron con el adaptador anterior y pasan con la corrección; la suite completa aprobó 30 de 30 pruebas. Se comprobó el rechazo en distintas posiciones, el error HTTP 502 sin la frase rechazada, la página local disponible por HTTP y una petición posterior válida con revisión requerida. `npm run check` y `git diff --check` terminaron sin errores; `npm audit --omit=dev --audit-level=high` no reportó vulnerabilidades. Todas las respuestas de Claude fueron simuladas: no se usaron claves reales ni datos de ciudadanos. No se realizó una nueva prueba manual de navegador en esta revisión.

El resultado de CI para este cambio debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); los resultados locales no confirman por sí solos las ejecuciones remotas en Node 22 y 24.

**Próximos pasos:** continuar la evaluación de accesibilidad por teclado, lectores de pantalla y navegadores descrita en [PRUEBAS.md](PRUEBAS.md). No se han realizado pruebas con comunidades ni se atribuye impacto validado.

## 2026-10-28 · Tipos estrictos para opciones cerradas

**Problema reproducido:** una lista como `["sin-agua"]` pasaba la comprobación de pertenencia porque JavaScript la convertía en una clave de texto. La misma coerción afectaba la validación del reporte, la proyección mínima de IA y la API opcional.

**Cambio:** las tres fronteras exigen cadenas primitivas antes de consultar las opciones permitidas. La API responde HTTP 400 para tipos inválidos, sin contactar al proveedor. Los campos libres siguen excluidos de la petición de IA, y el flujo local conserva su revisión humana y descarga manual.

**Verificación local:** Windows, Node v24.12.0. Las tres pruebas nuevas fallaron con la implementación anterior y pasan con la corrección; la suite completa aprobó 28 de 28 pruebas. `npm run check` y `git diff --check` terminaron sin errores; `npm audit --omit=dev --audit-level=high` no reportó vulnerabilidades. El proveedor se simuló en las pruebas; no se usaron claves reales ni se enviaron datos de ciudadanos.

El resultado remoto de cada commit debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); las comprobaciones locales no sustituyen la ejecución en Node 22 y 24 de CI.

**Próximos pasos:** ampliar las pruebas de salida de IA simulada para caracteres de control y continuar la validación independiente de accesibilidad descrita en [PRUEBAS.md](PRUEBAS.md). Las pruebas con personas y lectores de pantalla siguen pendientes; no se atribuyen resultados todavía.
