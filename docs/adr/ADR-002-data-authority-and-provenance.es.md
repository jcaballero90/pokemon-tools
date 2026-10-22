[![English](https://img.shields.io/badge/lang-en-red.svg)](ADR-002-data-authority-and-provenance.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](ADR-002-data-authority-and-provenance.es.md)

# ADR-002: Separar las fuentes de datos de combate y descriptivos

- **Fecha:** 2026-09-27
- **Estado:** Aceptada

## Contexto y restricciones

La tabla de tipos, las estadísticas, la validación de equipos y los resultados de daño necesitan un modelo de combate de novena generación coherente. La presentación de la Pokédex también se beneficia de sprites y metadatos descriptivos. La API descriptiva externa puede dejar de estar disponible independientemente de las utilidades de combate.

## Alternativas consideradas

- **Usar PokéAPI para todos los datos:** una sola integración sería más sencilla de explicar, pero haría depender los hechos y mecánicas de combate de una API elegida para datos descriptivos y de su disponibilidad.
- **Mantener una base local de combate y un calculador propios:** daría control completo, a costa de crear y validar un conjunto de datos mecánicos considerable, fuera del alcance de este TFM.

## Decisión y motivos

Se fijará `@smogon/calc` para las especies, movimientos, objetos, habilidades, efectividad de tipos y mecánicas de daño de la novena generación. La versión actual del paquete es `0.12.0`; las actualizaciones de dependencias requieren comprobar si cambian los resultados. Se usarán respuestas de PokéAPI almacenadas en caché en el servidor solo para detalles descriptivos. Las formas compatibles se asignarán explícitamente y se indicará que los datos descriptivos no están disponibles cuando no se pueda asignar una forma o falle PokéAPI; nunca se sustituirán datos de combate por valores de esa API.

## Consecuencias

- Las funciones de combate pueden continuar si PokéAPI no está disponible; los campos descriptivos podrían estar desactualizados o faltar.
- La aplicación debe mantener la correspondencia entre formas y el comportamiento de caché. Fijar el calculador hace deliberadas las actualizaciones, pero requiere revisiones periódicas.

## Pruebas y fuentes

- Decisión del proyecto: [requisitos REQ-003, REQ-004 y REQ-009](../requirements/requirements.es.md) y [mapa vivo de arquitectura](../architecture/architecture.es.md).
- Pruebas de implementación: [versiones de dependencias de la API](../../apps/api/package.json), [catálogo](../../apps/api/src/modules/catalog/catalog.ts), [adaptador de PokéAPI](../../apps/api/src/modules/catalog/pokeapi-adapter.ts) y [adaptador de Smogon](../../apps/api/src/modules/damage/smogon-adapter.ts).
- La jerarquía de fuentes es una decisión específica del proyecto. La [documentación del calculador de Smogon](https://github.com/smogon/damage-calc/blob/master/README.md) y la [documentación de PokéAPI](https://pokeapi.co/docs/v2) describen las integraciones externas.
