# Fuentes y mantenimiento del catálogo

Fecha de revisión inicial: 2026-10-27. El catálogo de `public/catalog.js` registra enlace, título, paráfrasis de evidencia, ámbito, propósito y fecha de verificación por entrada. No se copian formularios ni contenido extenso.

## Evidencia primaria

- [SUNASS: plataformas de atención y orientación](https://www.gob.pe/43281-direccion-de-usuarios-conoce-las-plataformas-de-atencion-y-orientacion-de-usuarios-de-la-sunass). Sustenta 1899, orientación nacional y seguimiento ante falta de respuesta del prestador; aclara que el regulador no atiende directamente el problema operativo.
- [SUNASS: ficha de contacto](https://www.gob.pe/institucion/sunass/contacto-y-numeros-de-emergencias). Sustenta WhatsApp (01) 614 3180 para problemas operativos no atendidos por la EPS. Corroboración: [nota oficial de abril de 2026](https://www.gob.pe/institucion/sunass/noticias/1384581-problemas-con-los-servicios-de-saneamiento-sunass-recuerda-sus-canales-gratuitos-de-atencion-a-usuarios).
- [Sedapal: Aquafono](https://www.gob.pe/institucion/sedapal/pages/12786-llamar-a-sedapal-aquafono). Sustenta (01) 317 8000 para falta de agua y alcantarillado; no establece cobertura universal.
- [SUNASS: formatos](https://www.gob.pe/institucion/sunass/informes-publicaciones/4502284-formatos-para-presentar-un-reclamo-en-servicios-de-agua-potable-y-saneamiento). Incluye solicitud particular, reclamos y solicitud de alcance general. El borrador libre del MVP no reemplaza esos formatos.
- [SUNASS: problemas que afectan a varias viviendas](https://www.gob.pe/institucion/sunass/noticias/896748-que-hacer-ante-problemas-con-el-agua-potable-o-alcantarillado-que-afecten-a-varias-viviendas). Contexto para diferenciar alcance comunitario y particular; no se implementa una clasificación jurídica automática.

Las fuentes se contrastaron con el texto oficial disponible e indexado. Algunas páginas de gob.pe rechazaron el acceso directo automatizado con HTTP 418. No se comprobó atención efectiva mediante llamadas, mensajes o presentación de trámites. No se afirma disponibilidad en tiempo real.

## Protocolo de cambio

1. Verifica el dominio y la titularidad pública de la fuente; prioriza una ficha institucional frente a notas antiguas.
2. Comprueba número, cobertura, propósito y restricciones. Contrasta otra fuente oficial cuando haya inconsistencias.
3. Actualiza la entrada y su fecha; documenta en el PR el enlace y lo comprobado. No inventes un teléfono si falta evidencia.
4. Ejecuta pruebas y revisa el texto en pantalla.
5. Revisa el catálogo completo antes de cambiar la fecha global `VERIFIED_AT`; no renueves la fecha de entradas que no revisaste.

La alerta actual usa la fecha del catálogo inicial. Si se amplía a muchas entradas, implementar revisión por entrada y suspender las no verificables. No se incluyen horarios para evitar afirmaciones inconsistentes entre fichas. No hay enlaces con reportes precargados ni transmisión automática al abrir una fuente; el navegador sí contacta al sitio oficial cuando la persona decide visitarlo.

Falta verificar un directorio de JASS, municipalidades y prestadores por localidad. La interfaz pide confirmar competencia y ofrece orientación de SUNASS; no afirma tener una ruta validada para todos los casos rurales.
