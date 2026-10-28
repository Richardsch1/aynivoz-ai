# Registro de mantenimiento

Este registro describe cambios y comprobaciones realmente realizados. No representa uso comunitario ni resultados de impacto.

## 2026-10-28 · Tipos estrictos para opciones cerradas

**Problema reproducido:** una lista como `["sin-agua"]` pasaba la comprobación de pertenencia porque JavaScript la convertía en una clave de texto. La misma coerción afectaba la validación del reporte, la proyección mínima de IA y la API opcional.

**Cambio:** las tres fronteras exigen cadenas primitivas antes de consultar las opciones permitidas. La API responde HTTP 400 para tipos inválidos, sin contactar al proveedor. Los campos libres siguen excluidos de la petición de IA, y el flujo local conserva su revisión humana y descarga manual.

**Verificación local:** Windows, Node v24.12.0. Las tres pruebas nuevas fallaron con la implementación anterior y pasan con la corrección; la suite completa aprobó 28 de 28 pruebas. `npm run check` y `git diff --check` terminaron sin errores; `npm audit --omit=dev --audit-level=high` no reportó vulnerabilidades. El proveedor se simuló en las pruebas; no se usaron claves reales ni se enviaron datos de ciudadanos.

El resultado remoto de cada commit debe consultarse en [GitHub Actions](https://github.com/Richardsch1/aynivoz-ai/actions); las comprobaciones locales no sustituyen la ejecución en Node 22 y 24 de CI.

**Próximos pasos:** ampliar las pruebas de salida de IA simulada para caracteres de control y continuar la validación independiente de accesibilidad descrita en [PRUEBAS.md](PRUEBAS.md). Las pruebas con personas y lectores de pantalla siguen pendientes; no se atribuyen resultados todavía.
