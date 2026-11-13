# Registro de mantenimiento

Este registro describe cambios y comprobaciones realmente realizados. No representa uso comunitario ni resultados de impacto.

## 2026-11-13 · Patrones numéricos con dígitos Unicode

**Recuperación local:** la carpeta configurada no existía al iniciar. Tras buscar la copia en ubicaciones cercanas y confirmar el remoto, se creó una copia nueva desde el commit público `bd7acdf33435628bc293375ffc3b572458b9f0ad` en la ruta original. El acceso existente de Richardsch1 permitió una comprobación de publicación sin cambios. La recuperación contiene lo publicado en GitHub; no acredita recuperar archivos o cambios locales que no estuvieran publicados.

**Problema reproducido:** secuencias ficticias de ceros de ancho completo o arábigo-índicos, y etiquetas de identificación seguidas de esos dígitos, pasaban la validación del reporte. Una frase simulada del proveedor con un único dígito decimal Unicode también se aceptaba. Las expresiones usaban `\d`, que solo reconocía los dígitos ASCII. No se observó una fuga de texto libre a Claude ni se usaron datos de ciudadanos.

**Cambio:** el detector local y el filtro de salida del proveedor usan `\p{Decimal_Number}` con modo Unicode. Se conservan los separadores y umbrales del reporte, la detección conjunta entre campos y los errores sin reproducir valores. No se transforma el texto con NFKC. Una sugerencia rechazada mantiene el error HTTP 502 genérico y el borrador local, sin reintentos. La categoría decimal no cubre números escritos con letras, romanos, superíndices ni toda ofuscación; la revisión humana sigue siendo obligatoria.

**Verificación local:** Windows, Node v24.12.0. Los tres grupos nuevos fallaron con el código anterior: reporte y sugerencia aceptados, y API con HTTP 200 en lugar de 502. Tras corregir los filtros, la suite completa aprobó 51 de 51 pruebas. Se comprobaron dígitos de ancho completo, arábigo-índicos, arábigo-índicos extendidos, devanagari y matemáticos astrales, mezclas con ASCII, separadores, etiquetas de identificación, atribución de campos sin eco y patrones repartidos. Se conservaron casos permitidos de texto español y secuencias cortas. Se verificó recuperación API 502 → 200 sin reintentos y página local disponible. `npm ci --ignore-scripts`, `npm run check`, `npm test`, `git diff --check` y `npm audit --omit=dev --audit-level=high` terminaron sin errores; la auditoría no reportó vulnerabilidades. Todos los dígitos de identificación utilizados son ceros ficticios y el proveedor fue simulado. No se usaron claves reales.

**Comprobación en navegador integrado:** con IA desactivada, una descripción ficticia con la etiqueta DNI y un cero de ancho completo se rechazó. El resumen recibió foco, la descripción quedó asociada al error sin copiar el dato al mensaje y el borrador permaneció oculto con descarga bloqueada. Se guardó una captura local fuera del repositorio. Tras corregir el texto y usar una zona ficticia con dos ceros arábigo-índicos, el reporte permitido generó el borrador local, retiró el error y conservó la revisión pendiente y la descarga bloqueada. Este recorrido no constituye una evaluación con lectores de pantalla ni de todos los navegadores.

El resultado remoto de este cambio debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); los resultados locales no confirman por sí solos CI en Node 22 y 24.

**Referencias técnicas:** [escapes de caracteres y propiedades Unicode en ECMAScript](https://tc39.es/ecma262/2025/multipage/text-processing.html#sec-compiletocharset) y [alias de categorías Unicode](https://www.unicode.org/Public/UCD/latest/ucd/PropertyValueAliases.txt), consultados el 13 de noviembre de 2026. `Decimal_Number` corresponde a la categoría `Nd`; no se amplió el filtro a toda la categoría `Number`.

**Contraste de fuentes:** las cuatro fuentes primarias del [catálogo](FUENTES.md) devolvieron HTTP 418 al abrirlas. Su texto oficial indexado consultado coincidió con los contactos y propósitos registrados. No se confirmó atención efectiva ni disponibilidad en tiempo real, ni se interpretaron esos bloqueos como enlaces rotos. Se mantienen los datos y fechas sin renovar la verificación global.

**Próximos pasos:** comprobar esta validación en otros navegadores y continuar la evaluación de accesibilidad con lectores de pantalla y restauración desde la caché de navegación. Siguen pendientes la validación comunitaria y la prueba opcional con una cuenta real de Anthropic, bajo consentimiento y presupuesto propios. No se atribuye adopción ni impacto comunitario validado.

## 2026-11-11 · Cancelación del cuerpo de errores del proveedor

**Problema reproducido:** una respuesta HTTP 429 simulada con un cuerpo abierto se rechazaba con `AI_UNAVAILABLE`, pero el adaptador no leía ni cancelaba ese cuerpo. Se comprobó la ausencia de cancelación; no se reprodujo agotamiento real de conexiones ni se midieron memoria o rendimiento. El plazo máximo existente de 12 segundos ya acota la petición real.

**Cambio:** ante un estado HTTP de error, el adaptador intenta cancelar el cuerpo antes de devolver su error interno genérico, sin leerlo ni analizarlo. Un cuerpo ausente o un fallo al cancelar no exponen detalles del proveedor o de limpieza. La API mantiene HTTP 502 genérico, sin reintentos, y libera su contador de concurrencia para la petición siguiente. No cambia el tratamiento de respuestas válidas, los datos mínimos enviados ni el borrador local.

**Verificación local:** Windows, Node v24.12.0. Los tres grupos de regresión fallaron con el código anterior porque no había cancelación. Con el cambio, la suite completa aprobó 48 de 48 pruebas. Se comprobaron HTTP 429 y 503 con cancelación sin lectura, cuerpo ausente, cancelación que rechaza con un detalle ficticio privado y recuperación API 502 → 200 sin reintentos, con página local disponible y revisión humana requerida. `npm run check` y `git diff --check` terminaron sin errores; `npm audit --omit=dev --audit-level=high` no reportó vulnerabilidades. Las respuestas del proveedor fueron simuladas, sin claves reales ni datos de ciudadanos. No se hizo una nueva prueba de navegador en esta revisión del servidor.

El resultado remoto de este cambio debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); las comprobaciones locales no confirman por sí solas CI en Node 22 y 24.

**Referencia técnica:** [gestión de cuerpos y recolección de basura en Undici](https://undici.nodejs.org/#garbage-collection), consultada el 11 de noviembre de 2026. Recomienda consumir o cancelar los cuerpos de respuesta en lugar de depender del recolector para liberar recursos de conexión. La corrección añade esa cancelación explícita temprana; no demuestra una mejora cuantificada de recursos.

**Contraste de fuentes:** se intentó abrir cada una de las cuatro fuentes primarias del [catálogo](FUENTES.md); todas devolvieron HTTP 418. El texto oficial indexado consultado no mostró discrepancias en números o propósitos. No se confirmó atención efectiva ni disponibilidad en tiempo real, y esos bloqueos no demuestran que los enlaces estén rotos. Se conservan contactos y fechas sin renovar la verificación global.

**Próximos pasos:** continuar la comprobación de restauración efectiva desde la caché de navegación y de accesibilidad con lectores de pantalla y otros navegadores. La integración con una cuenta real de Anthropic sigue pendiente y requiere consentimiento y presupuesto propios. No se atribuye adopción ni impacto comunitario validado.

## 2026-11-10 · Canales coherentes tras limpiar por navegación

**Problema reproducido en DOM simulado:** seleccionar Sedapal, registrar un reporte ficticio y ejecutar el manejador de `pagehide` restablecía el formulario a prestador desconocido, pero dejaba cuatro canales, incluido Aquafono, y el mensaje de reporte registrado. Ese estado podía quedar disponible si el navegador reutilizaba el documento al volver. No se observó un caso con ciudadanos.

**Cambio:** después de descartar el reporte y restablecer el formulario, la limpieza de salida borra el mensaje anterior y reconstruye el catálogo con la selección neutral. Sedapal vuelve a requerir confirmación expresa. Se conservan la cancelación de solicitudes pendientes, el borrado del borrador, la retirada del consentimiento opcional y la revisión obligatoria de cualquier nuevo borrador. Reconstruir el catálogo no hace solicitudes de red ni cambia sus fuentes o fechas.

**Verificación de regresión:** Windows, Node v24.12.0. Antes de corregir el cliente, sus cinco pruebas anteriores pasaron y la nueva falló al encontrar cuatro canales en lugar de tres. Con la corrección, la suite completa aprobó 46 de 46 pruebas. La nueva prueba usa eventos y un DOM mínimos simulados, comprueba dos limpiezas sucesivas y permite registrar después un reporte con prestador por confirmar. `npm run check` y `git diff --check` terminaron sin errores; `npm audit --omit=dev --audit-level=high` no reportó vulnerabilidades. No se utilizaron datos reales de ciudadanos ni se llamó a Anthropic con una clave real.

El resultado remoto de este cambio debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); las comprobaciones locales no confirman por sí solas CI en Node 22 y 24.

**Recorrido en navegador integrado:** con IA desactivada y el ejemplo ficticio, se seleccionó Sedapal, se generó y revisó un borrador y se navegó a una página vacía y de vuelta. Después de cargar la corrección, se comprobaron campos vacíos, prestador desconocido, borrador vacío y oculto, descarga bloqueada, mensaje vacío y solo tres canales sin Sedapal. Se guardó una captura local fuera del repositorio. El recorrido anterior a la corrección también regresó al estado neutral: no se confirmó que el navegador reutilizara la caché de navegación ni se reprodujo allí el fallo anterior. La reproducción y su corrección quedan acreditadas por la prueba del manejador, sin afirmar cobertura completa de BFCache o de otros navegadores.

**Referencia técnica:** [eventos de transición de página del estándar HTML](https://html.spec.whatwg.org/multipage/nav-history-apis.html#the-pagetransitionevent-interface), consultada el 10 de noviembre de 2026. La posibilidad de reutilización del documento depende del navegador; la limpieza no se condiciona a que se reutilice.

**Contraste de fuentes:** se revisaron las cuatro fuentes primarias del [catálogo](FUENTES.md) mediante su texto oficial indexado, sin encontrar discrepancias en números o propósitos. El acceso directo devolvió HTTP 418 o agotó el tiempo de espera. Este contraste documental no confirma atención efectiva ni disponibilidad en tiempo real; se mantienen los contactos y las fechas del catálogo sin renovar su verificación global.

**Próximos pasos:** comprobar la restauración efectiva desde BFCache en navegadores que la permitan y continuar las pruebas de accesibilidad con lectores de pantalla y otros navegadores. Siguen pendientes la validación comunitaria y la prueba opcional con una cuenta real de Anthropic, bajo consentimiento y presupuesto propios. No se atribuye adopción ni impacto validado.

## 2026-11-09 · Lectura acotada de respuestas del proveedor

**Problema reproducido:** una respuesta JSON simulada de 65.706 bytes con una frase válida y metadatos extensos se aceptaba, con o sin `Content-Length`. El límite solicitado de 200 tokens no limitaba el tamaño del cuerpo HTTP analizado. No se observó un incidente con usuarios ni se hicieron llamadas reales a Claude.

**Cambio:** el adaptador admite hasta 32 KiB de cuerpo antes de decodificar y analizar el JSON. Si la cabecera anuncia más, cancela sin leer el cuerpo; también cuenta los bytes realmente leídos y cancela al superar el límite aunque la cabecera falte o declare menos. No acumula el fragmento que excede el límite. Conserva la decodificación UTF-8, incluido un carácter dividido entre fragmentos y un BOM inicial, el plazo de 12 segundos y los filtros de la sugerencia. La API mantiene el error HTTP 502 genérico, sin contenido rechazado ni reintentos automáticos; el borrador local y la revisión humana permanecen disponibles.

Los 32 KiB son una decisión conservadora del MVP para una frase breve y sus metadatos, no un límite publicado por Anthropic. Acotan lo que la aplicación acumula para el análisis, no la memoria total del proceso ni el tráfico: el runtime y la red pueden haber almacenado fragmentos adicionales.

**Verificación local:** Windows, Node v24.12.0. Las tres nuevas regresiones de tamaño fallaron con el adaptador anterior: se aceptaban cuerpos excesivos y la API devolvía 200. La prueba del tamaño exacto de 32 KiB aceptó el caso válido. La revisión detectó además una diferencia al decodificar el BOM inicial, se reprodujo con una prueba y se corrigió antes de publicar. La suite completa aprobó 45 de 45 pruebas. Se comprobó cancelación antes de leer por cabecera, cancelación al cruzar el límite sin cabecera o con una menor, límites en bytes UTF-8, recuperación HTTP 502 → 200 sin reintento y página local disponible. `npm run check` y `git diff --check` terminaron sin errores; `npm audit --omit=dev --audit-level=high` no reportó vulnerabilidades. Todas las respuestas del proveedor fueron simuladas, sin claves reales ni datos de ciudadanos. No se hizo una nueva prueba de navegador en esta revisión del servidor.

El resultado remoto de este cambio debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); las comprobaciones locales no confirman por sí solas CI en Node 22 y 24.

**Referencia técnica:** [iteración asíncrona de Web Streams en Node.js 22](https://nodejs.org/docs/latest-v22.x/api/webstreams.html#async-iteration), consultada el 9 de noviembre de 2026. La salida anticipada del bucle cancela la lectura por defecto; las pruebas comprueban la cancelación sobre streams simulados que aún están abiertos.

**Próximos pasos:** comprobar errores por campo en un navegador real y con lectores de pantalla, y continuar la evaluación en otros navegadores. La integración con una cuenta real de Anthropic sigue pendiente y requiere consentimiento y presupuesto propios. Esta revisión no actualizó las fuentes ni las fechas del catálogo y no atribuye uso ni impacto comunitario validado.

## 2026-11-07 · Errores asociados al campo del reporte

**Problema confirmado en código y pruebas:** el enlace del resumen siempre llevaba al selector inicial, incluso cuando la validación detectaba un error en la descripción o la zona. Los campos no se asociaban con el mensaje de error.

**Cambio:** los errores locales del reporte pueden identificar un campo conocido. El cliente usa una lista cerrada de seis campos para dirigir el enlace, marcar `aria-invalid` y añadir el mensaje a `aria-describedby` conservando las ayudas existentes. Al limpiar o sustituir el error se retiran solo la marca y la asociación añadida por esta función. El foco inicial permanece en el resumen y los campos conservan su contenido.

La comprobación conjunta de patrones sensibles se conserva: si el patrón está repartido entre zona y descripción y no se puede atribuir a un único campo, se muestra el aviso general. Los mensajes no reproducen los datos que provocaron el rechazo. Los metadatos del campo no se añaden a las respuestas de la API ni a las peticiones a Claude.

**Verificación local:** Windows, Node v24.12.0. Antes del cambio, las pruebas de dominio y cliente obtuvieron 17 aprobadas y cuatro fallos esperados en la nueva atribución de campos y sus asociaciones. Después del cambio, la suite completa aprobó 41 de 41 pruebas. Se verificaron la conservación de ayudas, la retirada de la marca anterior, la ausencia de asociaciones duplicadas, la limpieza al editar/ejemplo/borrado/éxito, el aviso general para patrones repartidos y mensajes sin reproducir el contenido sensible. `npm run check` y `git diff --check` terminaron sin errores; `npm audit --omit=dev --audit-level=high` no reportó vulnerabilidades. Los casos usan datos ficticios y un DOM mínimo simulado para el cliente; no se llamó a Claude con una clave real.

**Límite de esta revisión:** el conector de pruebas del navegador falló al navegar a la aplicación local. No se confirmó esta mejora en Chrome ni con lectores de pantalla; las simulaciones no sustituyen esas comprobaciones.

El resultado remoto de este cambio debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); los resultados locales no confirman por sí solos CI en Node 22 y 24.

**Referencia de diseño:** [notificaciones de formularios de W3C WAI](https://www.w3.org/WAI/tutorials/forms/notifications/), consultada el 7 de noviembre de 2026. No se acredita conformidad con WCAG ni una evaluación con lectores de pantalla.

**Próximos pasos:** comprobar el enlace y el anuncio de errores por campo en un navegador real y con lectores de pantalla; mantener pendiente la evaluación en otros navegadores y con personas usuarias. No se atribuye uso ni impacto comunitario validado.

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
