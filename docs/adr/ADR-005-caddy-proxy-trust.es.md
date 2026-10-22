[![English](https://img.shields.io/badge/lang-en-red.svg)](ADR-005-caddy-proxy-trust.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](ADR-005-caddy-proxy-trust.es.md)

# ADR-005: Confiar en el reenvío solo a través de la ruta controlada de Caddy

- **Fecha:** 2026-09-27
- **Estado:** Aceptada

## Contexto y restricciones

Cuando se repare, producción debe usar HTTPS directo de DuckDNS, con Tailscale Funnel como alternativa pública. Staging privado utiliza un servicio Tailscale distinto con Serve HTTPS. Todas las rutas deben pasar por Caddy antes de llegar a Fastify. Las cabeceras de reenvío proporcionadas por el navegador no deben determinar la identidad del cliente, el host ni el protocolo. Docker puede asignar otra dirección al recrear un servicio.

## Alternativas consideradas

- **Exponer Fastify directamente mediante Serve o Funnel:** tendría menos pasos de proxy, pero evitaría la política compartida de cabeceras y el límite de entrada de las aplicaciones.
- **Confiar en una IP fija del contenedor Caddy:** parece restrictivo, pero es frágil cuando se recrea el contenedor.
- **Confiar en todos los proxies o en un número de saltos:** simplificaría la configuración, pero aceptaría información ajena a la ruta de proxy verificada si cambia la topología.

## Decisión y motivos

Caddy permanecerá delante de Fastify en todas las rutas públicas y de tailnet. El listener público directo sobrescribe las cabeceras de reenvío entrantes. Los dos listeners de Caddy limitados al loopback del host solo aceptan la dirección del cliente reenviada por Tailscale desde el par inmediato configurado; después sobrescriben la IP del cliente, el host y las cabeceras de reenvío HTTPS antes de enviar la petición al proxy. Se eliminan las cabeceras de identidad de Tailscale que no se utilizan.

Solo Caddy y la API correspondiente pueden unirse a cada red de borde exclusiva. Antes de atender una petición de Better Auth, Fastify comprueba el **par del socket sin procesar** frente a la subred de borde del entorno y rechaza cualquier par que no pertenezca a ella. La función `trustProxy` de Fastify solo confía en ese CIDR. Better Auth usa la única cabecera `X-Real-IP` escrita por Caddy, una URL base HTTPS explícita y orígenes de confianza. La opción de cabecera de Better Auth no impone por sí sola el límite del socket. La política depende de controlar la pertenencia a la red y la configuración de la subred, no de una IP fija del contenedor Caddy.

## Consecuencias

- La cadena de confianza es explícita y tolera que cambie la dirección del contenedor Caddy dentro de la subred asignada.
- Un contenedor conectado por error a la red de borde podría quedar dentro del CIDR de confianza de Fastify; son necesarios controles para limitar la pertenencia e inspeccionar las redes desplegadas.
- El comportamiento exacto del par Tailscale-Caddy y de las cabeceras reenviadas depende del host. Las pruebas de suplantación, host, protocolo, cookies y rechazo de pares ajenos a la red son comprobaciones de publicación, no resultados supuestos.
- Staging necesita su propio hostname porque las cookies se delimitan por host, no por puerto.

## Pruebas y fuentes

- Decisión del proyecto: [requisitos REQ-011 y REQ-012](../requirements/requirements.es.md), [mapa vivo de arquitectura](../architecture/architecture.es.md) y [procedimiento de verificación del host](../operations.es.md).
- Pruebas de implementación: [Caddyfile](../../infra/caddy/Caddyfile), [redes Compose](../../infra/compose/caddy.yaml), [protección Fastify](../../apps/api/src/app.ts), [comprobación CIDR](../../apps/api/src/ingress.ts) y [configuración Better Auth](../../apps/api/src/modules/auth/auth.ts).
- Referencias externas: [opciones de confianza en proxy de Fastify](https://fastify.dev/docs/latest/Reference/Server/) y [configuración de proxies de confianza de Caddy](https://caddyserver.com/docs/caddyfile/options). La política conjunta es una decisión del proyecto; la ruta a través del mini PC aún no está verificada.
