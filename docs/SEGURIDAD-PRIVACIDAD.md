# Seguridad y privacidad

## Datos y ciclo de vida

El reporte contiene tipo, alcance, zona general, prestador declarado y descripción. Solo vive en memoria del navegador. No usa almacenamiento web persistente. Borrar todo, recargar o abandonar la página descarta ese estado. El evento de salida limpia también el estado para evitar recuperarlo mediante la caché de navegación.

El borrador descargado sí persiste en el dispositivo y puede contener lo que la persona haya escrito. Debe revisarse y custodiarse. No hay borrado remoto de descargas. El sistema operativo, extensiones, capturas y otras aplicaciones pueden retener contenido.

No se piden datos de identidad ni se aceptan adjuntos o geolocalización. El detector de patrones no detecta todos los nombres, domicilios o información sensible. El consentimiento no vuelve segura una descripción que incluya datos de terceros.

Con Claude activado se transmiten solo dos valores de listas cerradas, después de la autorización de la persona. No se promete anonimato ni retención cero por parte del proveedor. La integración usa la API comercial de la cuenta del operador; revisa sus términos, retención y costos antes de habilitarla. Revocar consentimiento no revierte datos ya enviados.

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
| Costos o saturación | Una petición simultánea y seis intentos por minuto por instancia, cuerpo máximo 4 KiB, salida de 200 tokens y espera al proveedor de 12 s. El límite en memoria se reinicia al reiniciar el proceso. |
| Información vencida | Fecha visible y alerta tras 90 días. No se comprueba disponibilidad en tiempo real. |
| Confianza excesiva | Plantilla marcada como borrador, hechos no verificados, confirmación de revisión y sin envío automático. |

## Antes de uso real o despliegue público

Este es un prototipo local, no un servicio ciudadano público. Antes de tratar datos reales se requiere evaluar con personas competentes el marco peruano aplicable de protección de datos, finalidades, consentimiento, transferencias, retención y canales para ejercer derechos. Este documento no certifica cumplimiento normativo.

Para un servicio público hacen falta autenticación, autorización, protección contra abuso, TLS, límites distribuidos de costo, configuración segura del proxy, revisión de registros del hosting, un mecanismo de incidentes y evaluación independiente. No basta con cambiar el puerto o exponer el servidor con un túnel. Los filtros simples de la IA no garantizan exactitud de sus frases ni seguridad semántica.

No pegues datos reales en GitHub, pruebas, capturas, solicitudes de soporte o llamadas de demostración. Si se filtra una clave, revócala y rótala en el proveedor; borrar un commit no invalida una credencial.
