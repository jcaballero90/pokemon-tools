[![English](https://img.shields.io/badge/lang-en-red.svg)](ADR-004-compose-and-shared-caddy.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](ADR-004-compose-and-shared-caddy.es.md)

# ADR-004: Desplegar una imagen de aplicación con Compose y Caddy compartido

- **Fecha:** 2026-09-27
- **Estado:** Aceptada

## Contexto y restricciones

La primera versión se ejecuta en un mini PC autohospedado con staging privado y producción pública. Ambos entornos necesitan bases de datos y secretos diferentes, mientras un único proxy inverso debe gestionar la entrada a sus aplicaciones. El frontend usa `/api` en el mismo origen; la imagen de producción debe poder utilizarse en ambos entornos mediante configuración de ejecución.

## Alternativas consideradas

- **Usar Kubernetes ahora:** ofrece mejores capacidades de orquestación, pero añade configuración y mantenimiento de un clúster sin una necesidad actual de varios nodos o escalado.
- **Imágenes separadas para frontend y API:** permitirían desplegarlos por separado, pero añadirían otro artefacto y preocupaciones de origen cruzado o enrutamiento a esta versión pequeña.
- **Incluir un proxy en el proyecto de aplicación de cada entorno:** aislaría más al principio, pero duplicaría la configuración de entrada y complicaría compartir los puertos 80/443 del host.

## Decisión y motivos

Se compilará una imagen que contenga los recursos estáticos del frontend Vite y la API Fastify. Fastify servirá los recursos y `/api` internamente. Se usarán tres proyectos Compose: Caddy compartido, aplicación y base de datos de staging, y aplicación y base de datos de producción. Caddy se unirá a la red de borde de cada entorno; cada API también se unirá a la red privada de base de datos de su entorno. Ni la API ni PostgreSQL publicarán puertos del host. Caddy publicará los puertos públicos 80/443 y escuchas independientes limitadas al loopback del host para Serve de staging y Funnel de producción.

Compose es proporcional al despliegue actual en un host. El mismo digest se ejecutará en staging y producción con valores de base de datos, autenticación y URL pública distintos. La decisión sobre la confianza en el proxy se documenta por separado en [ADR-005](ADR-005-caddy-proxy-trust.es.md).

## Consecuencias

- El host tiene un único proxy orientado a las aplicaciones y límites de entorno claros en la configuración.
- Caddy es infraestructura compartida: un fallo del proxy o una recarga incorrecta puede afectar a ambos entornos, por lo que sus cambios necesitan comprobaciones propias.
- El diseño depende de una asignación correcta a las redes de Docker y de la publicación en loopback del host; ambos comportamientos aún requieren verificación en el mini PC.
- La imagen única acopla las publicaciones de frontend y API. Se reconsiderará el escalado independiente si el uso real lo justifica.

## Pruebas y fuentes

- Decisión del proyecto: [requisitos REQ-010, REQ-012 y REQ-013](../requirements/requirements.es.md), [mapa vivo de arquitectura](../architecture/architecture.es.md) y [guía de operaciones](../operations.es.md).
- Pruebas de implementación: [Dockerfile](../../Dockerfile), [Compose de Caddy compartido](../../infra/compose/caddy.yaml), [Compose de staging](../../infra/compose/staging.yaml) y [Compose de producción](../../infra/compose/production.yaml).
- Influencia del curso: la lección validada **Arquitectura del software → Introducción a la arquitectura de software → Criterios para comparar estilos de arquitectura** informa del equilibrio de proporcionalidad. Compose, la estructura de la imagen y Caddy compartido son decisiones aprobadas para el proyecto.
