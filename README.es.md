[![English](https://img.shields.io/badge/lang-en-red.svg)](README.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](README.es.md)

# Pokémon Tools

Aplicación web bilingüe en inglés y español de España para explorar datos de combate de la novena generación de Pokémon Escarlata y Pokémon Púrpura, preparar equipos y estimar el daño. Los visitantes pueden crear y comparar dos equipos en el navegador. Una cuenta permite guardar equipos privados.

Este repositorio contiene el proyecto TFM en curso. La aplicación está desplegada en staging y producción en el mini PC del propietario; producción está disponible en `https://jcrserver.duckdns.org`. Siguen pendientes algunas comprobaciones integrales del producto y de seguridad; consulta los [requisitos](docs/requirements/requirements.es.md) y la [estrategia de pruebas](docs/testing/test-strategy.es.md).

## Funciones

- Explora los enfrentamientos defensivos de tipos de la novena generación por tipo o por Pokémon y consulta las estadísticas de combate en orden de la Pokédex Nacional.
- Busca en el catálogo completo de la Pokédex, carga las entradas progresivamente y abre cada entrada directamente en `/pokedex/:slug`.
- Consulta los movimientos de Escarlata y Púrpura agrupados en pestañas Nivel, MT, Huevo y, cuando corresponde, Otros, con nombres localizados e iconos de categoría.
- Crea y compara dos equipos de hasta seis Pokémon; los borradores de visitantes se guardan en el almacenamiento local de ese navegador.
- Estima el intervalo de daño de un movimiento y la probabilidad de debilitamiento en un golpe **si el movimiento acierta**.
- Crea una cuenta de correo electrónico y contraseña para guardar, volver a abrir, listar o eliminar equipos privados.
- Cambia entre inglés y español de España. El idioma inicial se determina a partir de la configuración del navegador, salvo que el usuario haya guardado una preferencia.

Los datos y las mecánicas de combate proceden de una versión fijada de `@smogon/calc`. PokéAPI proporciona detalles descriptivos almacenados en la caché del servidor y etiquetas en español de España cuando están disponibles; las instantáneas generadas hacen que los datos de traducción sean reproducibles sin descargarlos al iniciar la aplicación. Una caída del servicio o una forma sin correspondencia no sustituye los datos de combate. La [política de fuentes de datos](docs/data-sources.es.md) explica la autoridad, la procedencia y las limitaciones actuales. La API acepta especies, movimientos, habilidades y objetos conocidos sin comprobar la legalidad de los equipos en torneos. Las generaciones anteriores, el inicio de sesión con Google y un simulador de combates entre jugadores quedan fuera del alcance de la versión actual.

## Tecnologías y estructura del proyecto

| Área | Implementación actual |
| --- | --- |
| Web | React, TypeScript, Vite, React Router, Tailwind CSS y componentes de Radix UI. |
| API y contratos | Fastify 5, Node.js 24, Zod 4, OpenAPI generado, Better Auth, Helmet y limitación de solicitudes de Fastify. |
| Datos | PostgreSQL 18, Prisma 7, `@smogon/calc` fijado y caché de PokéAPI en el servidor. |
| Verificación | Vitest, Testing Library, Playwright, comprobaciones estáticas de Compose, GitHub Actions Checks, configuración de CodeQL y Dependabot. |
| Diseño del despliegue | Una imagen web/API, proyectos Compose separados para staging y producción, Caddy compartido, promoción GHCR por digest, despliegue asistido por Tailscale y copias de seguridad cifradas con restic en USB. |

| Ruta | Propósito |
| --- | --- |
| [`apps/web`](apps/web/) | Interfaz del navegador, borradores de visitantes y recorridos Playwright. |
| [`apps/api`](apps/api/) | Rutas Fastify y módulos de catálogo, daño, equipos y autenticación. |
| [`packages/contracts`](packages/contracts/) | Esquemas Zod y tipos seguros para el navegador. |
| [`infra`](infra/) | Archivos Compose, configuración de Caddy y scripts de despliegue, copia de seguridad y restauración. |
| [`.github/workflows`](.github/workflows/) | Comprobaciones, análisis de código, compilación/despliegue en staging y promoción a producción. |
| [`docs`](docs/) | Requisitos, decisiones, guías, evidencia de pruebas y registros de metodología del TFM. |

La API es un monolito modular con límites prácticos; el [mapa de arquitectura](docs/architecture/architecture.es.md) y sus [ADR](docs/architecture/architecture.es.md#registros-de-decisión) explican el diseño. El navegador llama a `/api` en el mismo origen; la [guía de contratos de la API](docs/api-contracts.es.md) enumera las rutas actuales y la cobertura de OpenAPI. Para consultar cómo se conecta cada vista con la interfaz, la ruta, el adaptador, la fuente de datos y el almacenamiento, consulta la [guía de la web](docs/website-guide.es.md). La [auditoría de código del 03-10-2026](docs/code-audit-2026-10-03.es.md) registra hallazgos, correcciones y límites de verificación.

## Ejecución local

Requisitos previos: Node.js 24, pnpm 11 (el workspace fija `pnpm@11.19.0`) y Docker Desktop para el contenedor local de PostgreSQL, o un servidor PostgreSQL 18 existente. Ejecuta los siguientes comandos desde la raíz del repositorio.

1. Instala las dependencias y genera el cliente de Prisma:

   ```sh
   pnpm install --frozen-lockfile
   pnpm db:generate
   ```

2. Copia [`apps/api/.env.example`](apps/api/.env.example) a `apps/api/.env`. Sustituye `POSTGRES_PASSWORD` por una contraseña local segura para URL y usa la misma contraseña en `DATABASE_URL`. Sustituye `BETTER_AUTH_SECRET` por un valor aleatorio de al menos 32 caracteres. No incluyas `.env` en Git; los valores del ejemplo son marcadores. Configura `PUBLIC_BASE_URL` y `TRUSTED_ORIGINS` como `http://127.0.0.1:5173` para que coincidan con la dirección local predeterminada de Vite. La configuración SMTP es opcional para explorar la aplicación; la verificación del correo y el restablecimiento de contraseña requieren un servicio de correo operativo.

3. Inicia el contenedor de la base de datos local:

   ```sh
   pnpm db:up
   ```

   Comandos habituales para la base de datos, desde la raíz del repositorio:

   ```sh
   pnpm db:status  # comprueba si PostgreSQL está en ejecución
   pnpm db:logs    # muestra los registros; pulsa Ctrl+C para dejar de verlos
   pnpm db:stop    # detiene PostgreSQL y conserva sus datos
   pnpm db:down    # elimina el contenedor y la red, pero conserva el volumen de datos
   ```

   Puedes omitir los comandos del contenedor si ya tienes un servidor PostgreSQL local.

4. Aplica la migración de desarrollo e inicia ambas aplicaciones:

   ```sh
   pnpm db:migrate
   pnpm dev
   ```

Vite sirve la interfaz en `http://127.0.0.1:5173` y redirige `/api` a Fastify en `http://127.0.0.1:4000`. La interfaz OpenAPI interactiva de la API está disponible en `http://127.0.0.1:4000/docs` durante el desarrollo. Usa el mismo nombre de host en el navegador y en la configuración de autenticación para mantener las cookies en el origen previsto.

## Comprobaciones

```sh
pnpm build
pnpm check
pnpm lint
pnpm test
pnpm config:check
pnpm docs:check
```

`pnpm test:e2e` ejecuta los recorridos de navegador de Playwright y necesita el navegador configurado y PostgreSQL local; Playwright inicia los servidores de API y web y espera a que estén disponibles. La [estrategia de pruebas](docs/testing/test-strategy.es.md) distingue las comprobaciones realizadas de los ejercicios del host y de la revisión humana pendientes. El 22-10-2026 pasaron ESLint del repositorio, las comprobaciones de TypeScript, la compilación de contratos, la compilación de producción de Vite, la auditoría de textos de interfaz, 49 pruebas de API y 82 pruebas web. La prueba de navegador de la Pokédex no pudo iniciarse en ese entorno porque faltaba el ejecutable de Chromium configurado. El [registro de workflow](docs/tfm/ai-methodology/workflows/007-post-rollout-product-evolution.es.md) conserva los resultados históricos fechados y las limitaciones actuales.

## Estado del despliegue y documentación

La ruta de publicación utiliza las comprobaciones satisfactorias de `staging` para crear una imagen, desplegarla mediante un digest inmutable y ejecutar pruebas privadas a través de Tailscale Serve. Una ejecución satisfactoria de Checks en `main` inicia la promoción a producción, compara el árbol Git de `main` con el registrado en staging y despliega ese mismo digest. Producción se ejecuta detrás de Caddy compartido en `https://jcrserver.duckdns.org`; staging privado usa Tailscale Serve. El fallback público opcional de Tailscale Funnel no es necesario para la ruta DuckDNS activa. El [plan de infraestructura](docs/infrastructure/infrastructure-plan.es.md) registra la topología; la [guía de operaciones del mini PC](docs/operations.es.md) registra la configuración, los ajustes de CI/CD, la evidencia de publicación y los pasos de recuperación. El [último workflow del TFM](docs/tfm/ai-methodology/workflows/007-post-rollout-product-evolution.es.md) recoge la evolución del producto y las comprobaciones pendientes.

| Elemento de entrega del TFM | Estado actual |
| --- | --- |
| URL del repositorio GitHub | [github.com/jcaballero90/pokemon-tools](https://github.com/jcaballero90/pokemon-tools) |
| URL pública de la aplicación | `https://jcrserver.duckdns.org` (el propietario informa de que la publicación de producción y la página funcionan). |
| Presentación y vídeo explicativo | Pendientes; se añadirán los enlaces cuando estén creados. |
| Acceso de revisor | `<user>` / `<password>` son solo marcadores. El propietario preparará credenciales de prueba para la entrega final sin incluir contraseñas reales en el repositorio. |

Otros documentos del proyecto: [plan de seguridad](docs/security/security-plan.es.md), [metodología del TFM y evidencia de workflows](docs/tfm/ai-methodology/README.es.md), y el [workflow de evolución del producto](docs/tfm/ai-methodology/workflows/007-post-rollout-product-evolution.es.md). Antes de entregar el TFM, revisa la URL real de GitHub, la aplicación publicada, los materiales de entrega y el acceso del revisor.
