[![English](https://img.shields.io/badge/lang-en-red.svg)](ADR-001-modular-monolith.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](ADR-001-modular-monolith.es.md)

# ADR-001: Usar un monolito modular con límites Clean pragmáticos

- **Fecha:** 2026-09-27
- **Estado:** Aceptada

## Contexto y restricciones

La primera versión combina unas pocas utilidades de novena generación, cuentas y equipos privados relacionados. Una sola persona desarrolladora debe construirla, probarla, explicarla y alojarla en un mini PC. El espacio de trabajo aprobado contiene una aplicación de navegador React/Vite, una API Fastify y contratos Zod seguros para el navegador dentro de un monorepo `pnpm`. El simulador de combate futuro queda fuera de esta versión.

## Alternativas consideradas

- **Separar servicios desde el principio:** los límites de despliegue independientes podrían ayudar si más adelante los módulos necesitasen escalado o responsables distintos. Ahora añadirían comunicación entre servicios, despliegues y modos de fallo sin que exista ese requisito.
- **Aplicar una capa rígida de Clean Architecture a cada función:** uniformaría la dirección de las dependencias, pero las operaciones sencillas de solo lectura del catálogo adquirirían interfaces y archivos sin un beneficio actual suficiente.
- **Un proceso sin límites entre módulos:** sería lo más sencillo al principio, pero dificultaría distinguir y probar la responsabilidad de daño, persistencia y autenticación a medida que creciese el proyecto.

## Decisión y motivos

Se utilizará un único proceso Fastify organizado en torno a `catalog`, `damage`, `teams` y `auth`. Las rutas convierten las peticiones HTTP en operaciones de aplicación. Se introducirán puertos cuando una dependencia externa justifique poder sustituirla: `TeamStore` para persistencia y `DamageCalculator` para el cálculo de combate. Las lecturas sencillas del catálogo serán directas. La interfaz y la API compartirán contratos seguros para el navegador y se comunicarán mediante `/api` en el mismo origen.

Esta elección de límites es **pragmática**; no afirma que el código actual cumpla todas las reglas de dependencias de Clean Architecture. La validación de equipos llama actualmente a `damage.validateSet`, cuya ruta predeterminada conecta el adaptador de Smogon, y las lecturas del catálogo usan directamente esa biblioteca. Se refactorizarán esas rutas si dificultan cambios o pruebas; este ADR no exige capas especulativas.

## Consecuencias

- El desarrollo local y el despliegue tienen menos piezas, y los cambios relacionados se pueden probar juntos.
- La responsabilidad de cada módulo y los puntos de adaptación permiten hacer pruebas centradas y extraer módulos en el futuro si las pruebas lo justifican.
- Un fallo o pico de recursos en un módulo puede afectar a todo el proceso de API. Los límites dependen de la revisión del código, no del aislamiento entre procesos.
- El simulador futuro podría necesitar una decisión de arquitectura propia; este ADR no lo diseña por adelantado.

## Pruebas y fuentes

- Decisión del proyecto: [requisitos REQ-001, REQ-010 y REQ-013](../requirements/requirements.es.md) y [mapa vivo de arquitectura](../architecture/architecture.es.md).
- Pruebas de implementación: [configuración del espacio de trabajo](../../pnpm-workspace.yaml), [composición de la API](../../apps/api/src/app.ts), [puerto de equipos](../../apps/api/src/modules/teams/teams.ts) y [puerto de daño](../../apps/api/src/modules/damage/damage.ts).
- Influencia del curso: las lecciones validadas **Arquitectura del software → Introducción a la arquitectura de software → Monolito modular** y **Aplicando Clean Architecture con TypeScript → Puertos y adaptadores** y **Estructura de carpetas de un proyecto Clean** explican los patrones y sus límites. La división de módulos y la pila son decisiones del proyecto, no prescripciones del curso.
