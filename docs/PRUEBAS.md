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

## CI

El flujo versionado ejecuta comprobaciones y pruebas en Ubuntu con Node 22 y 24, en push, pull request o ejecución manual. Las acciones de GitHub están fijadas por SHA y sus referencias se contrastaron contra los repositorios oficiales. El resultado remoto debe consultarse en la pestaña Actions; este documento no convierte una configuración de CI en un resultado aprobado.

## Pendiente

Evaluación independiente de accesibilidad, pruebas con lectores de pantalla y otros navegadores (incluido el guardado real de archivos), validación comunitaria y de rutas rurales, revisión de seguridad para uso público y prueba opcional con una cuenta real de Anthropic bajo consentimiento y presupuesto propios.
