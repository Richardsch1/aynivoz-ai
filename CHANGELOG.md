# Historial

## 2026-11-26

La comprobación previa a publicar rechaza archivos de entorno privados incluidos en el índice de Git, aunque falten en el disco, y mantiene permitido el `.env` local ignorado. La plantilla `.env.example` sigue admitida. Una copia sin metadatos Git propios conserva el análisis de archivos y avisa de que no pudo comprobar un índice; un fallo de Git en una copia con metadatos bloquea la comprobación.

## 2026-11-25

La ayuda opcional exige que una respuesta exitosa del proveedor declare `application/json` antes de leer su cuerpo. Un tipo ausente o inesperado se descarta intentando cancelar el cuerpo; se mantienen el error público genérico, el borrador local y la ausencia de reintentos automáticos. La cabecera correcta no sustituye los límites, la validación del contenido ni la revisión humana.

## 2026-11-24

Se documenta un procedimiento reproducible para comprobar la descarga de un borrador ficticio. En el navegador integrado se verificó el archivo realmente guardado, su nombre y su contenido UTF-8 exacto, además del bloqueo al editar sin revisar de nuevo. Esta revisión amplía la evidencia de funcionamiento; no modifica la aplicación ni acredita otros navegadores.

## 2026-11-23

Los enlaces a fuentes oficiales incluyen el nombre del canal en su nombre accesible, para distinguirlos al navegar por una lista de enlaces. Conservan el texto visible, los destinos del catálogo y sus protecciones al abrir otra pestaña. Se comprueba que los nombres y las fuentes sigan asociados al cambiar de prestador o limpiar el reporte.

## 2026-11-21

El detector compartido del reporte y de las sugerencias de IA reconoce patrones de correo con letras y marcas combinantes Unicode, incluidos dominios con acentos. Se mantienen los errores sin reproducir el contenido, el flujo local y la revisión humana. Sigue siendo una heurística limitada; no verifica entregabilidad ni detecta todas las formas de ocultar datos personales.

## 2026-11-19

Se amplía la verificación de cancelación durante la lectura del cuerpo de una respuesta, usando transporte HTTP real con un proveedor falso en loopback. Se documenta el recorrido comprobado en navegador con el ejemplo ficticio: retirada del consentimiento, recuperación explícita y borrado durante una petición pendiente. Estas comprobaciones no validan procesamiento ni cargos en Anthropic.

## 2026-11-18

El servidor solicita cancelar la ayuda opcional al detectar que el cliente cerró la conexión antes de completar la respuesta. La señal se combina con el plazo existente de doce segundos. El intento sigue contando para la cuota y la concurrencia se libera cuando termina la operación; no se garantiza detener procesamiento o cargos ya iniciados en el proveedor.

## 2026-11-17

Se añaden pruebas del cliente con respuestas de IA diferidas para verificar los controles existentes de consentimiento, cancelación, descarte de respuestas tardías y recuperación explícita. Se comprueba que solo se envían tipo, alcance y consentimiento, y que una respuesta anterior no altera la solicitud nueva ni el borrador revisable.

## 2026-11-16

El adaptador de Claude descarta respuestas con bytes UTF-8 inválidos en lugar de aceptar frases con caracteres sustituidos por daños en la codificación. Conserva UTF-8 válido dividido entre fragmentos y BOM inicial, el error genérico, el borrador local y la revisión humana, sin reintentos automáticos.

## 2026-11-15

Los errores de descarga aparecen junto al borrador con foco visible y enlace para revisarlo. Un fallo conserva el texto, retira la revisión y bloquea la descarga hasta confirmarla de nuevo. Los errores inesperados del navegador muestran un mensaje genérico; las URLs temporales se liberan también si falla el inicio de la descarga.

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
