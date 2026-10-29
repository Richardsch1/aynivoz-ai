# Registro de mantenimiento

Este registro describe cambios y comprobaciones realmente realizados. No representa uso comunitario ni resultados de impacto.

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
