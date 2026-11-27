# Registro de verificación

## Primera versión · 2026-10-27

Ejecutada el 2026-10-27 con Node v24.12.0 en Windows.

### Comprobaciones automatizadas locales

- `npm run check`: sin errores de sintaxis ni coincidencias con los patrones de secretos revisados; catálogo con dominios oficiales.
- `npm test`: 25 pruebas aprobadas. Incluyen reglas de reporte, patrones sensibles, borradores, revisión, selección de canales, caducidad, cabeceras HTTP, acceso a archivos, origen/host, validación de la API, límites de tamaño y costo, concurrencia y fallos del proveedor.
- `npm audit --omit=dev --audit-level=high`: sin vulnerabilidades reportadas; el proyecto no tiene dependencias de ejecución.

Las pruebas HTTP usan conexiones locales. El primer intento en un entorno restringido no pudo conectarse al servidor (EACCES); se repitieron con acceso a loopback y las 25 pasaron. El adaptador de Claude se prueba con respuestas simuladas; no se usó una clave real ni se comprobó un modelo concreto.

### Revisión en Chrome

- Carga de formulario, catálogo y ejemplo ficticio.
- Registro de un reporte ficticio y generación de borrador editable.
- Descarga deshabilitada antes de revisar, habilitada al confirmar y de nuevo deshabilitada al editar.
- Bloqueo de un identificador ficticio en el formulario.
- Claude desactivado y plantilla local disponible.
- Cambio de prestador invalida el borrador; Sedapal aparece solo tras selección expresa.
- Borrado de la pestaña y ocultamiento del borrador al recargar.
- Revisión visual de escritorio y vista de 390 × 844, sin desbordamiento horizontal visible.

Se pulsó la descarga y la interfaz confirmó su inicio. La herramienta de automatización no capturó el evento de descarga dentro del tiempo de espera; no se afirma haber comprobado el archivo guardado por Chrome. La lógica de revisión y el contenido generado sí están cubiertos por pruebas. No se presentaron solicitudes a entidades públicas.

## Descarga real en el navegador integrado: 2026-11-24

Se comprobó el guardado de un archivo real en el navegador integrado (IAB) de Codex en Windows, con Claude desactivado y sin llamadas a una API de IA. Se usaron únicamente el ejemplo y el texto ficticios. Antes de confirmar la revisión, la descarga estaba bloqueada; confirmarla la habilitó. Editar el borrador retiró la confirmación y volvió a bloquearla. Tras revisar de nuevo, se capturó la descarga completada y se leyó el archivo guardado.

El archivo `aynivoz-borrador-revisado.txt` contenía 212 bytes, se decodificó como UTF-8 estricto sin errores y coincidió byte a byte con el texto esperado. Su SHA-256 fue `e508f47696312453702bce7cdbaf42448a41ecaea2d224d797ff099b9b8579e6`.

### Procedimiento reproducible con datos ficticios

1. Abre la aplicación local, carga el ejemplo ficticio, revisa la privacidad y registra el reporte para generar el borrador. Después abre «Ayuda opcional de Claude» y confirma que Claude está desactivado.
2. Sustituye el borrador por el texto siguiente, con saltos de línea LF y sin salto al final. Confirma que la descarga permanece bloqueada hasta marcar la revisión.

   ```text
   BORRADOR FICTICIO — NO PRESENTADO

   Solicito revisar mañana la presión del agua y la atención en la zona ficticia.

   Prueba de descarga: español, acción y saneamiento. Sin datos reales ni envío a entidades.
   ```

3. Marca la revisión, edita un carácter y comprueba que la revisión se retira y la descarga se bloquea. Restaura el texto exacto y vuelve a revisarlo y confirmarlo.
4. Pulsa descargar y espera a que el navegador termine de guardar. Conserva cualquier archivo anterior: el navegador puede añadir un sufijo al nombre; comprueba el archivo nuevo sin sobrescribir otros archivos.
5. Lee ese archivo como UTF-8 estricto, compara su contenido con el texto anterior y verifica los 212 bytes y el SHA-256 indicado. Por ejemplo, en PowerShell, ajusta la ruta únicamente al archivo ficticio recién descargado:

   ```powershell
   $archivoPrueba = 'C:\ruta\aynivoz-borrador-revisado.txt'
   $bytesPrueba = [System.IO.File]::ReadAllBytes($archivoPrueba)
   $utf8Estricto = [System.Text.UTF8Encoding]::new($false, $true)
   $utf8Estricto.GetString($bytesPrueba)
   $bytesPrueba.Length
   Get-FileHash -LiteralPath $archivoPrueba -Algorithm SHA256
   ```

El mensaje «Descarga iniciada» no acredita por sí solo que se haya guardado el archivo: aquí se verificó el archivo real y su contenido. El resultado se limita a IAB en Windows; siguen pendientes el guardado en otros navegadores y las pruebas con lectores de pantalla. No se usaron datos reales de ciudadanos ni se enviaron solicitudes a entidades.

## Distribución del formulario: 2026-11-27

Prueba manual de regresión en el navegador integrado (IAB), Windows, sin Claude y con opciones y texto ficticios. No es una prueba automática nueva ni una evaluación completa de accesibilidad.

**Reproducción anterior:** en una ventana de 700 × 1000 píxeles, seleccionar «Falta o interrupción de agua» y «Varias viviendas o una comunidad» dejaba los dos campos en una misma fila, con 180 píxeles de ancho cada uno. El texto seleccionado quedaba cortado. No se observó desbordamiento horizontal de la página.

### Procedimiento para repetir la regresión

1. Inicia la aplicación con Claude desactivado. Abre una ventana de prueba de 700 × 1000 píxeles y selecciona las dos opciones anteriores.
2. Comprueba visualmente el texto, además de medir los campos: ahora deben estar uno debajo del otro y mostrar completas esas dos opciones en este entorno. La medida de `scrollWidth` de un selector nativo no demuestra que su texto esté completo.
3. Usa Tab desde el tipo de problema y confirma que el siguiente campo es el alcance, con foco visible. Cambia el ancho sin recargar: conserva las selecciones.
4. Repite en los anchos de la tabla. Comprueba también que el ancho desplazable del documento no supera su ancho interior. La barra de desplazamiento vertical reduce el espacio interior; no se debe comparar solo con el ancho exterior de la ventana.
5. A 700 píxeles, carga el ejemplo ficticio, revisa su privacidad y registra el reporte. Comprueba que el borrador recibe foco y que no puede descargarse sin revisar. Confirma la revisión y cambia a 1000 píxeles: el borrador y su revisión se conservan. Edita un carácter y comprueba que se retira la revisión y vuelve a bloquearse la descarga. Borra el contenido de prueba al terminar.

### Resultado observado

| Ancho de ventana en píxeles | Ancho de cada selector en píxeles | Distribución |
| --- | --- | --- |
| 320 | 269 | Una columna |
| 390 | 339 | Una columna |
| 640 | 589 | Una columna |
| 641 | 319 | Una columna |
| 700 | 378 | Una columna |
| 850 | 528 | Una columna |
| 851 | 461 | Una columna |
| 1000 | 296 | Dos columnas |
| 1280 | 387,5 | Dos columnas |

Las medidas corresponden a IAB con su fuente y barra de desplazamiento en Windows. No se observó desplazamiento horizontal de la página en esos anchos y las selecciones se conservaron al cambiar de tamaño. A 700 píxeles se confirmó visualmente el texto completo; a 1280, los campos volvieron a dos columnas con ambas opciones completas. Se comprobó el recorrido de revisión del paso 5 sin descargar ni presentar una solicitud y con Claude desactivado.

**Límite observado:** a 320 píxeles, el campo de alcance permanece en una columna pero su texto seleccionado sigue cortándose parcialmente. El cambio no acredita legibilidad completa con cualquier ancho o fuente. Siguen pendientes ese caso estrecho, el zoom al 200 %, otros navegadores y lectores de pantalla. Los valores, etiquetas, orden del documento y comportamiento de los controles no se modifican.

## CI

El flujo versionado ejecuta comprobaciones y pruebas en Ubuntu con Node 22 y 24, en push, pull request o ejecución manual. Las acciones de GitHub están fijadas por SHA y sus referencias se contrastaron contra los repositorios oficiales. El resultado remoto debe consultarse en la pestaña Actions; este documento no convierte una configuración de CI en un resultado aprobado.

## Pendiente

Evaluación independiente de accesibilidad, pruebas con lectores de pantalla y otros navegadores (incluido el guardado real de archivos), validación comunitaria y de rutas rurales, revisión de seguridad para uso público y prueba opcional con una cuenta real de Anthropic bajo consentimiento y presupuesto propios.
