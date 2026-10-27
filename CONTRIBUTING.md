# Contribuir a AyniVoz AI

Gracias por ayudar a mejorar una herramienta comunitaria en una fase inicial. No publiques datos reales de ciudadanos, claves, documentos de identidad, recibos ni capturas con información personal. Usa escenarios marcados como ficticios.

## Flujo

1. Explica el problema y el cambio propuesto en un issue sin información sensible.
2. Crea un fork y una rama; ejecuta `npm ci --ignore-scripts` con Node 22 o 24.
3. Mantén mensajes, errores y ayuda en español claro.
4. Añade pruebas cuando cambies validaciones, seguridad, rutas o comportamiento relevante.
5. Ejecuta `npm run check` y `npm test`; revisa también la interfaz móvil y por teclado.
6. Abre un PR con el problema, el comportamiento final, fuentes cuando corresponda y evidencia de las pruebas realmente ejecutadas.

Para canales oficiales, sigue [FUENTES.md](docs/FUENTES.md). No aceptamos teléfonos generados por IA, supuestas alianzas, métricas inventadas ni trámites automáticos sin diseño y revisión propios. No subas `.env`, salidas del proveedor con datos reales o archivos de ciudadanos.

Mantén el catálogo independiente del modelo. El flujo principal debe funcionar sin claves y sin IA. Evita introducir analítica, persistencia o dependencias remotas sin discutir el cambio de privacidad y alcance.

Las contribuciones se reciben bajo la licencia MIT del proyecto. No se exige un acuerdo adicional de cesión.
