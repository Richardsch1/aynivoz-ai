# Arquitectura del MVP

Node.js 22+ sirve archivos locales y una API opcional sin dependencias de terceros.

```text
Persona → formulario → validación local → reporte en memoria
                                      → plantilla → revisión → archivo .txt
                                      → catálogo de fuentes oficiales

Persona → consentimiento opcional → tipo + alcance → servidor → Anthropic
                                                        ← frase no verificada
```

## Módulos

- `public/domain.js`: opciones permitidas, validación, proyección mínima para IA y plantilla.
- `public/catalog.js`: catálogo manual; no depende del modelo ni de texto de usuarios.
- `public/app.js`: estado de un reporte en memoria, formulario, revisión y descarga.
- `server/app.js`: lista cerrada de archivos públicos, control de host/origen, tamaño y costo.
- `server/claude.js`: adaptador del proveedor y validación de entrada/salida.
- `tests/`: pruebas nativas de Node con proveedor simulado.

No existen endpoints para almacenar reportes, enviar cartas, subir archivos ni buscar ciudadanos. No hay persistencia, autenticación, base de datos ni seguimiento real. Los campos libres nunca se incluyen en peticiones al servidor. El adaptador no expone la clave a la interfaz y no recibe URLs del cliente.

Cambiar cualquier campo del reporte invalida el borrador y cancela la petición de IA pendiente. Editar el borrador desmarca la revisión. Revocar consentimiento descarta respuestas pendientes; no puede deshacer una petición ya transmitida. La sugerencia nunca se inserta automáticamente en el documento.

## Opciones deliberadas

La plantilla determinista permite verificar su comportamiento y ejecutar el producto sin IA. El registro efímero reduce la exposición de datos en este MVP. La IA opcional solo ayuda con una frase genérica; no determina autoridades, requisitos, hechos ni prioridades. No se usa generación aumentada con fuentes ni herramientas de navegación del modelo.

No se implementa una ruta de producción pública. Un despliegue multiusuario exige diseño nuevo de autenticación, consentimiento, protección frente a abuso, límites por usuario, TLS, controles de proxy, auditoría y evaluación de datos personales. Exponer este servidor local mediante un túnel no lo convierte en un servicio listo para producción.
