# Historial

## 2026-10-29

El adaptador de Claude rechaza frases con controles bidireccionales explícitos o DEL, que el texto local ya bloqueaba. La API descarta la frase y devuelve un error genérico. Las pruebas de regresión comprueban ese rechazo, la disponibilidad del borrador local y la recuperación de la siguiente petición válida.

## 2026-10-28

La validación del reporte, la proyección de IA y la API opcional ahora exigen opciones de tipo texto, sin convertir listas u objetos a claves válidas. Las solicitudes con tipos inválidos se rechazan antes de contactar al proveedor. Incluye pruebas de regresión para las tres fronteras y un [registro de mantenimiento](docs/MANTENIMIENTO.md).

## 0.1.0 · 2026-10-27

Primera implementación del MVP local en español: reporte efímero, borrador editable con revisión humana, descarga de texto y catálogo limitado con fuentes oficiales. Incluye adaptador opcional de Claude en servidor, desactivado por defecto, licencia MIT, documentación, pruebas y CI.

No hay resultados de impacto comunitario validados ni llamadas de producción a Claude en esta versión.
