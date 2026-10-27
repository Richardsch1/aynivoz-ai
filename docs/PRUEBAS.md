# Verificación de la primera versión

Ejecutada el 2026-10-27 con Node v24.12.0 en Windows.

## Comprobaciones automatizadas locales

- `npm run check`: sin errores de sintaxis ni coincidencias con los patrones de secretos revisados; catálogo con dominios oficiales.
- `npm test`: 25 pruebas aprobadas. Incluyen reglas de reporte, patrones sensibles, borradores, revisión, selección de canales, caducidad, cabeceras HTTP, acceso a archivos, origen/host, validación de la API, límites de tamaño y costo, concurrencia y fallos del proveedor.
- `npm audit --omit=dev --audit-level=high`: sin vulnerabilidades reportadas; el proyecto no tiene dependencias de ejecución.

Las pruebas HTTP usan conexiones locales. El primer intento en un entorno restringido no pudo conectarse al servidor (EACCES); se repitieron con acceso a loopback y las 25 pasaron. El adaptador de Claude se prueba con respuestas simuladas; no se usó una clave real ni se comprobó un modelo concreto.

## Revisión en Chrome

- Carga de formulario, catálogo y ejemplo ficticio.
- Registro de un reporte ficticio y generación de borrador editable.
- Descarga deshabilitada antes de revisar, habilitada al confirmar y de nuevo deshabilitada al editar.
- Bloqueo de un identificador ficticio en el formulario.
- Claude desactivado y plantilla local disponible.
- Cambio de prestador invalida el borrador; Sedapal aparece solo tras selección expresa.
- Borrado de la pestaña y ocultamiento del borrador al recargar.
- Revisión visual de escritorio y vista de 390 × 844, sin desbordamiento horizontal visible.

Se pulsó la descarga y la interfaz confirmó su inicio. La herramienta de automatización no capturó el evento de descarga dentro del tiempo de espera; no se afirma haber comprobado el archivo guardado por Chrome. La lógica de revisión y el contenido generado sí están cubiertos por pruebas. No se presentaron solicitudes a entidades públicas.

## CI

El flujo versionado ejecuta comprobaciones y pruebas en Ubuntu con Node 22 y 24, en push, pull request o ejecución manual. Las acciones de GitHub están fijadas por SHA y sus referencias se contrastaron contra los repositorios oficiales. El resultado remoto debe consultarse en la pestaña Actions; este documento no convierte una configuración de CI en un resultado aprobado.

## Pendiente

Evaluación independiente de accesibilidad, pruebas con lectores de pantalla, otros navegadores, validación comunitaria y de rutas rurales, revisión de seguridad para uso público y prueba opcional con una cuenta real de Anthropic bajo consentimiento y presupuesto propios.
