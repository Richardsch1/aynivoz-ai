# Seguridad y privacidad

## Datos y ciclo de vida

El reporte contiene tipo, alcance, zona general, prestador declarado y descripción. Solo vive en memoria del navegador. No usa almacenamiento web persistente. Borrar todo, recargar o abandonar la página descarta ese estado. El evento de salida limpia también el estado para evitar recuperarlo mediante la caché de navegación.

Al limpiar por salida, el catálogo se reconstruye después de restablecer el prestador a «por confirmar» y se retira el mensaje del reporte anterior. Sedapal vuelve a requerir una selección expresa; no se conserva una atribución de cobertura del reporte descartado. Esta limpieza no contacta a las entidades ni modifica las fechas de verificación del catálogo.

El borrador descargado sí persiste en el dispositivo y puede contener lo que la persona haya escrito. Debe revisarse y custodiarse. No hay borrado remoto de descargas. El sistema operativo, extensiones, capturas y otras aplicaciones pueden retener contenido.

No se piden datos de identidad ni se aceptan adjuntos o geolocalización. El detector de patrones no detecta todos los nombres, domicilios o información sensible. El consentimiento no vuelve segura una descripción que incluya datos de terceros.

Con Claude activado se transmiten solo dos valores de listas cerradas, después de la autorización de la persona. No se promete anonimato ni retención cero por parte del proveedor. La integración usa la API comercial de la cuenta del operador; revisa sus términos, retención y costos antes de habilitarla. Revocar consentimiento no revierte datos ya enviados.

Las opciones del reporte y de la ayuda de IA deben ser cadenas de texto primitivas incluidas en sus listas cerradas. Se rechazan listas, objetos, números y booleanos sin convertirlos a texto. En la API, una opción con tipo inválido devuelve HTTP 400 antes de contactar al proveedor.

Los patrones de identificación y secuencias numéricas del reporte usan la categoría Unicode `Decimal_Number` (`Nd`). Incluyen dígitos de otros alfabetos y mezclas con ASCII, manteniendo los separadores admitidos y el umbral de siete dígitos, o un dígito tras las etiquetas DNI, pasaporte o RUC. Se conserva la comprobación conjunta de zona y descripción, sin reproducir los valores rechazados en el error. El filtro de la sugerencia de IA rechaza cualquier dígito de esa categoría, como ya hacía con los dígitos ASCII. No se convierte el texto con NFKC ni se interpreta como un número. La categoría no cubre números escritos con letras, números romanos, superíndices ni toda ofuscación; no es una garantía de detectar datos personales.

Las sugerencias de IA con controles bidireccionales U+202A–U+202E, U+2066–U+2069 o DEL se descartan completas, al igual que los controles ya bloqueados por el adaptador. La API devuelve un error genérico sin incluir la frase rechazada; el borrador local sigue disponible. Este filtro no garantiza la seguridad semántica ni detecta todo carácter invisible: la revisión humana continúa siendo obligatoria.

Antes de unir el contenido del proveedor, el adaptador exige `stop_reason: "end_turn"` y una lista no vacía de bloques `text` cuyo contenido sea una cadena. Descarta respuestas truncadas, motivos de finalización ausentes o no admitidos, otros tipos de bloque y valores no textuales; no procesa herramientas ni bloques de razonamiento. Un rechazo mantiene el error HTTP 502 genérico y no provoca una llamada de continuación ni un reintento automático. La [documentación de motivos de finalización de Anthropic](https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons) distingue el fin normal de los límites de generación; finalizar normalmente no certifica la exactitud de la frase.

El adaptador admite un cuerpo de respuesta de hasta 32 KiB antes de decodificar y analizar el JSON. Rechaza y cancela el cuerpo si `Content-Length` anuncia más; también cuenta los bytes realmente leídos y cancela al superar el límite, aunque la cabecera falte o declare menos. El límite incluye metadatos y texto, y se aplica además de `max_tokens`. No garantiza un techo de memoria total del proceso ni de bytes transferidos: el runtime y la red pueden haber almacenado fragmentos adicionales. La sugerencia rechazada no se devuelve y el borrador local permanece disponible.

Ante un estado HTTP de error del proveedor, el adaptador intenta cancelar su cuerpo sin leerlo ni analizarlo. Esto evita dejar su liberación únicamente a la recolección de basura o al plazo máximo de espera. Si no hay cuerpo o falla la cancelación, se mantiene el error genérico: no se devuelve el detalle de limpieza ni se hace otra llamada. No se afirma una reducción medida de conexiones o memoria.

## Amenazas y controles

| Riesgo | Control y límite |
| --- | --- |
| Exposición de claves | Variables de entorno del servidor; archivos privados ignorados; respuesta de configuración con solo un booleano; lista cerrada de archivos públicos. |
| XSS o contenido activo | Texto con `textContent`/textarea, bloqueo de etiquetas y controles, CSP restrictiva, sin HTML generado por modelos. |
| Prompt injection | Texto libre excluido del modelo, listas cerradas y claves de entrada exactas. El modelo no tiene herramientas ni capacidad de enviar trámites. |
| Contactos o procedimientos falsos | Catálogo manual con fuentes primarias. La salida del modelo no altera catálogo o destinatario. Revisión humana sigue siendo necesaria. |
| Filtración mediante errores | No se devuelven errores internos ni cuerpos del proveedor. No se registran reportes, claves o prompts. No se incluyen herramientas de analítica. |
| SSRF | Destino de Anthropic fijo y redirecciones rechazadas; no se reciben URLs del cliente. |
| Peticiones desde otra web | Escucha en loopback, validación de Host, Origin exacto y Sec-Fetch-Site; no CORS; solo JSON. |
| Costos o saturación | Una petición simultánea y seis intentos por minuto por instancia, solicitud máxima de 4 KiB, respuesta del proveedor limitada a 32 KiB para su análisis, salida solicitada de 200 tokens y espera al proveedor de 12 s. El contador de intentos se reinicia al reiniciar el proceso. |
| Información vencida | Fecha visible y alerta tras 90 días. No se comprueba disponibilidad en tiempo real. |
| Confianza excesiva | Plantilla marcada como borrador, hechos no verificados, confirmación de revisión y sin envío automático. |

## Antes de uso real o despliegue público

Este es un prototipo local, no un servicio ciudadano público. Antes de tratar datos reales se requiere evaluar con personas competentes el marco peruano aplicable de protección de datos, finalidades, consentimiento, transferencias, retención y canales para ejercer derechos. Este documento no certifica cumplimiento normativo.

Para un servicio público hacen falta autenticación, autorización, protección contra abuso, TLS, límites distribuidos de costo, configuración segura del proxy, revisión de registros del hosting, un mecanismo de incidentes y evaluación independiente. No basta con cambiar el puerto o exponer el servidor con un túnel. Los filtros simples de la IA no garantizan exactitud de sus frases ni seguridad semántica.

No pegues datos reales en GitHub, pruebas, capturas, solicitudes de soporte o llamadas de demostración. Si se filtra una clave, revócala y rótala en el proveedor; borrar un commit no invalida una credencial.
