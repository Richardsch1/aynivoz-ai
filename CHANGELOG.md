# Historial

## 2026-11-13

El detector de patrones numéricos del reporte y el filtro de sugerencias de IA reconocen dígitos decimales Unicode, incluidos alfabetos mezclados. Se conservan los umbrales del reporte, los errores sin reproducir datos, el borrador local y la revisión humana. La detección sigue siendo limitada y no cubre todas las formas de ocultar información personal.

## 2026-11-11

La ayuda opcional intenta cancelar el cuerpo de las respuestas HTTP de error del proveedor antes de rechazar la sugerencia, sin leer ese contenido. Si la cancelación falla o el cuerpo no existe, conserva el error genérico y no añade reintentos. El flujo local sigue disponible.

## 2026-11-10

La limpieza al salir de la página reconstruye los canales para el prestador por confirmar y borra el mensaje del reporte anterior. Evita conservar el canal de Sedapal después de retirar su selección. Mantiene el borrado del reporte y el requisito de revisar un nuevo borrador antes de descargarlo.

## 2026-11-09

La ayuda opcional limita a 32 KiB el cuerpo de respuesta del proveedor antes de analizar su JSON. Rechaza tamaños excesivos anunciados o detectados durante la lectura y cancela el cuerpo, contando bytes incluso sin una cabecera fiable. Mantiene el error genérico, el borrador local y la ausencia de reintentos automáticos.

## 2026-11-07

El resumen de errores del reporte enlaza al campo identificado y lo asocia al mensaje sin retirar sus ayudas existentes. Las marcas se limpian al editar, cambiar de error, cargar el ejemplo, borrar o registrar correctamente. Los patrones sensibles repartidos entre campos siguen bloqueados y conservan el aviso general.

## 2026-11-06

La ayuda opcional de Claude exige una respuesta finalizada normalmente y formada por bloques de texto válidos antes de preparar la sugerencia. Descarta resultados cortados, motivos de finalización inesperados y valores que antes podían convertirse a texto por coerción. No añade reintentos automáticos ni cambia el borrador local.

## 2026-11-01

Los errores de validación local al registrar un reporte aparecen en un resumen con foco visible y un enlace para volver al formulario. Se conserva lo escrito, el aviso se limpia al editar y los reportes válidos siguen llevando el foco al borrador con revisión obligatoria antes de descargar.

## 2026-10-29

El adaptador de Claude rechaza frases con controles bidireccionales explícitos o DEL, que el texto local ya bloqueaba. La API descarta la frase y devuelve un error genérico. Las pruebas de regresión comprueban ese rechazo, la disponibilidad del borrador local y la recuperación de la siguiente petición válida.

## 2026-10-28

La validación del reporte, la proyección de IA y la API opcional ahora exigen opciones de tipo texto, sin convertir listas u objetos a claves válidas. Las solicitudes con tipos inválidos se rechazan antes de contactar al proveedor. Incluye pruebas de regresión para las tres fronteras y un [registro de mantenimiento](docs/MANTENIMIENTO.md).

## 0.1.0 · 2026-10-27

Primera implementación del MVP local en español: reporte efímero, borrador editable con revisión humana, descarga de texto y catálogo limitado con fuentes oficiales. Incluye adaptador opcional de Claude en servidor, desactivado por defecto, licencia MIT, documentación, pruebas y CI.

No hay resultados de impacto comunitario validados ni llamadas de producción a Claude en esta versión.
