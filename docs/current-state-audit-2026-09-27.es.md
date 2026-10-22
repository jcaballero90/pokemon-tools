[![English](https://img.shields.io/badge/lang-en-red.svg)](current-state-audit-2026-09-27.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](current-state-audit-2026-09-27.es.md)

# Auditoría del estado actual — 2026-09-27

> **Instantánea de un momento concreto; no es documentación viva.** Esta auditoría describe el repositorio y observaciones locales limitadas del 2026-09-27. Cambios posteriores de código, dependencias, configuración o despliegue pueden haber dejado obsoletas algunas partes. Actualiza los [requisitos](requirements/requirements.es.md), la [arquitectura](architecture/architecture.es.md) y los planes vivos para los cambios aprobados; conserva este archivo como evaluación fechada.

**Repositorio:** `pokemon-tools`, rama `main`, HEAD `deb3c4c13a74d8bc0d9ab7c3536417f562957e21` (`establish Pokémon Tools TFM application, documentation, and deployment baseline`). El origen configurado es `https://github.com/jcaballero90/pokemon-tools.git`; no se comprobó si el remoto estaba disponible. Al comenzar esta auditoría, el árbol de trabajo tenía dos habilidades locales sin seguimiento, `react-best-practices` y `frontend-testing-debugging`, instaladas en la tarea anterior. No se modificaron archivos de aplicación para esta auditoría.

**Límite de las pruebas:** inspeccioné [AGENTS.md](../AGENTS.md), las habilidades del repositorio, documentos y ADR, código fuente, pruebas, flujos y scripts de infraestructura. Consulté el índice privado de conocimiento y lecciones validadas pertinentes para distinguir verificación, validación de la persona propietaria y diseño proporcionado; aquí no se reproduce material privado del curso. Ejecuté una comprobación local limitada de los flujos públicos con el navegador, dependencias instaladas, una configuración API desechable y Chrome sin interfaz. Esta estación tenía Node 24.18.0 y pnpm fijado disponible mediante Corepack, pero no un ejecutable `pnpm` en `PATH`, comandos Docker/psql, listener PostgreSQL ni despliegue activo. Las rutas con base de datos, CI y mini PC **no se verificaron en esta auditoría**. No repetí las afirmaciones de pruebas superadas históricas de los documentos vivos.

## 1. Estado actual del proyecto

| Estado | Pruebas observadas en el repositorio | Límite |
| --- | --- | --- |
| Implementado localmente | Catálogo de novena generación y tabla de tipos ofensiva; estadísticas base de Pokédex; cálculo de daño; dos borradores de invitado en el navegador y comparación por cantidad/tipos; rutas de cuenta y código de persistencia de equipos privados; dos registros de equipos profesionales con atribución. Véanse [interfaz web](../apps/web/src/main.tsx), [composición de API](../apps/api/src/app.ts) y [requisitos REQ-001–009](requirements/requirements.es.md). | «Implementado» no significa «aceptado» ni «verificado en producción». Los recorridos completos de cuenta y caché de Pokédex necesitan PostgreSQL. |
| Configurado | Contratos compartidos, esquema y migración inicial de Prisma, Swagger, Helmet y límites de frecuencia, imagen Docker, Compose de staging/producción/borde, Caddy, comprobaciones y promoción en GitHub, scripts de copia/restauración. Véanse [contratos](../packages/contracts/src/index.ts), [Prisma](../apps/api/prisma/schema.prisma), [infraestructura](../infra/) y [flujos](../.github/workflows/). | La configuración no demuestra que la imagen arranque en el mini PC ni que funcionen la entrada, el correo, CI o la recuperación USB. |
| Parcial o pendiente | Cobertura de respuestas OpenAPI; política CSRF de mutaciones propias; presentación exacta de fuente/versión/fecha de equipos profesionales; pruebas del adaptador de base de datos y entre cuentas; recorridos completos del navegador; política de verificación de correo y si se permiten equipos incompletos guardados. Se sigue en [contratos de API](api-contracts.es.md), [seguridad](security/security-plan.es.md), [fuentes de datos](data-sources.es.md), [pruebas](testing/test-strategy.es.md) y [requisitos](requirements/requirements.es.md). | Siguen siendo necesarias las decisiones de la persona propietaria y pruebas ejecutables. |
| No creado ni encargado | No hay script de datos iniciales, simulador de combate, soporte de generaciones anteriores, interfaz española, integración de métricas/alertas, sitio público verificado ni despliegue/restauración verificados. Las funciones aplazadas están fuera del alcance de la primera versión. | No trates funciones futuras opcionales como trabajo pendiente de la primera versión. |

**Interpretación:** es una implementación amplia de primera versión en fase de **verificación previa a publicación**, no un simple armazón. El commit inicial contiene casi todas las interfaces de aplicación planificadas y bastante automatización de despliegue. El plan aprobado no tiene hitos de funciones fechados, por lo que no se puede afirmar que esté «por delante del plan» en comparación con un calendario. La cantidad de implementación supera lo que esperaba la persona propietaria, mientras siguen pendientes las pruebas de base de datos, navegador, CI, host y validación por su parte.

El [registro de metodología de IA](tfm/ai-methodology/workflows/005-project-documentation-pass.es.md) indica que la aplicación se construyó antes de la revisión documental posterior y no reconstruye una secuencia de instrucciones de construcción que no se guardó. Por ello resulta especialmente útil que la persona propietaria revise las decisiones de implementación; esto no demuestra que no estuvieran aprobadas.

## 2. Reproducir el entorno de desarrollo local

La guía breve de configuración de referencia es el [README](../README.es.md); esta sección añade detalles de base de datos, parada y restablecimiento. Salvo que se indique lo contrario, ejecuta los comandos desde la raíz del repositorio en PowerShell.

| Requisito previo | Versión o propósito |
| --- | --- |
| Node.js | `>=24.11 <25`, según el [paquete raíz](../package.json). Durante esta auditoría había Node 24.18.0. |
| pnpm | `11.19.0`, fijado por `packageManager`. Comprueba que `pnpm --version` funciona en `PATH`; `corepack enable` es una vía de instalación y quizá requiera una consola elevada en Windows. Aquí no funcionó simplemente `corepack pnpm dev`, porque el script raíz vuelve a invocar `pnpm`. |
| PostgreSQL | Versión 18 para la pila aprobada y los archivos Compose. Usa un servicio local o contenedor Docker desechable. Docker es opcional si ya tienes PostgreSQL 18. |
| Pruebas del navegador | Binario Chromium de Playwright; cuando haga falta, instálalo con `pnpm --filter @pokemon-tools/web exec playwright install chromium`. |

Para una base Docker desechable, sustituye el marcador de contraseña y usa el mismo valor en `apps/api/.env`:

```powershell
docker run --name pokemon-dev-db -d -p 127.0.0.1:5432:5432 -e POSTGRES_USER=pokemon -e POSTGRES_PASSWORD=YOUR_LOCAL_PASSWORD -e POSTGRES_DB=pokemon -v pokemon_dev_data:/var/lib/postgresql postgres:18
Copy-Item apps/api/.env.example apps/api/.env
```

Edita el archivo ignorado `apps/api/.env`:

| Variable | Ajuste local |
| --- | --- |
| `DATABASE_URL` | `postgresql://pokemon:YOUR_LOCAL_PASSWORD@127.0.0.1:5432/pokemon`. Codifica con porcentaje los caracteres de contraseña reservados. |
| `BETTER_AUTH_SECRET` | Valor aleatorio generado localmente de al menos 32 caracteres; no uses el marcador de ejemplo. |
| `PUBLIC_BASE_URL` | `http://127.0.0.1:5173`, que coincide con el host enlazado por Vite. |
| `TRUSTED_ORIGINS` | `http://127.0.0.1:5173`. |
| Opcionales | `PORT=4000`, `NODE_ENV=development`, `DEPLOY_ENV=development`, `SMTP_URL`, `EMAIL_FROM`. Las dos últimas activan la verificación de correo y el restablecimiento de contraseña si ambas están configuradas. `EDGE_CIDR` y `STATIC_DIR` son opciones de despliegue, no requisitos locales. Véanse el [esquema de configuración](../apps/api/src/config.ts) y la [configuración de autenticación](../apps/api/src/modules/auth/auth.ts). |

Después instala dependencias, genera el cliente Prisma, aplica la migración inicial e inicia ambos servicios:

```powershell
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate
pnpm dev
```

No hay un paso de carga de datos iniciales. En la fecha de esta auditoría había dos equipos profesionales definidos en código; esa función se eliminó posteriormente. Los datos de combate se incluyen mediante `@smogon/calc` fijado; las cuentas y equipos guardados se crean desde la aplicación en ejecución. Vite local sirve `http://127.0.0.1:5173/` y envía `/api` a Fastify en `127.0.0.1:4000`. La API expone `/api/health`; Swagger de desarrollo está en `http://127.0.0.1:4000/docs` y su JSON en `/docs/json`. Usa el mismo hostname de forma coherente para las cookies del navegador. En la fecha de esta auditoría, la interfaz tenía una única URL `/`; sus siete vistas eran pestañas dentro de la página.

Detén `pnpm dev` con Ctrl+C. Detén o reinicia el contenedor opcional con `docker stop pokemon-dev-db` o `docker start pokemon-dev-db`. Para **eliminar datos locales de desarrollo** y volver a aplicar migraciones, ejecuta `pnpm --filter @pokemon-tools/api exec prisma migrate reset` con la URL de desarrollo prevista. Los borradores de invitado del navegador están separados: si necesitas una interfaz limpia, borra las claves `pokemon-guest-team` y `pokemon-comparison-team` del almacenamiento del origen local. No uses estos pasos de restablecimiento en staging ni producción.

| Comprobación | Comando |
| --- | --- |
| Esquema Prisma | `pnpm db:validate` |
| Pruebas unitarias, API e interfaz | `pnpm test` |
| Recorridos de navegador con base local en marcha | `pnpm test:e2e` |
| Comprobación de tipos | `pnpm check` |
| Lint | `pnpm lint` |
| Compilaciones de producción | `pnpm build` |
| YAML de flujos/Compose y comprobaciones de red seleccionadas | `pnpm config:check` |

La [configuración de Playwright](../apps/web/playwright.config.ts) inicia los servidores de desarrollo y usa `http://127.0.0.1:5173`; para los recorridos de cuenta aún necesita una base de datos preparada y `apps/api/.env`. El flujo [Checks](../.github/workflows/checks.yml) prepara PostgreSQL en CI, aplica migraciones e instala Chromium. Esta auditoría no volvió a ejecutar esas suites.

## 3. Recorrido por la aplicación y procedencia de datos

| Pantalla o flujo | Comportamiento actual | Origen de los datos |
| --- | --- | --- |
| Overview | Página de entrada con enlaces al constructor, daño, tabla de tipos y equipos profesionales en la fecha de la auditoría. | Texto de interfaz en [main.tsx](../apps/web/src/main.tsx). |
| Tabla de tipos | Filas de tipos atacantes frente a columnas de tipos defensores; se mostraron 19 filas en la prueba local del navegador. | `GET /api/type-chart`, calculado con datos fijados de Smogon de novena generación en [catalog.ts](../apps/api/src/modules/catalog/catalog.ts). |
| Pokédex | Busca una especie/forma del catálogo, muestra estadísticas base y solicita ID, sprite, altura y peso. La interfaz muestra ID y sprite, no la altura/peso devueltos. | Estadísticas base de Smogon. Datos descriptivos del [adaptador PokéAPI](../apps/api/src/modules/catalog/pokeapi-adapter.ts), guardados 24 horas en PostgreSQL con alternativa de caché obsoleta. Se almacena la **URL** del sprite, no sus bytes. |
| Constructor de equipos | Edita dos equipos de hasta seis Pokémon, compara cantidad y tipos únicos de miembros y permite guardar/reabrir/eliminar un equipo con sesión iniciada. | Borradores en el `localStorage` de este navegador; registros autenticados en PostgreSQL mediante el [almacén de equipos](../apps/api/src/modules/teams/prisma-adapter.ts). No hay datos ficticios integrados en ejecución. |
| Daño | Un atacante, defensor, movimiento y campo seleccionados; muestra intervalo de PS/porcentaje y probabilidad de KO de un golpe condicionada a acertar. | `POST /api/damage`, calculador Smogon fijado mediante el [adaptador](../apps/api/src/modules/damage/smogon-adapter.ts). La probabilidad mostrada no incorpora la precisión del movimiento. |
| Cuenta | Registro e inicio/cierre de sesión con correo/contraseña; biblioteca privada según sesión. | Better Auth y PostgreSQL. SMTP es opcional localmente; activarlo cambia el comportamiento de verificación. Aquí no se probó con base de datos. |

El inventario de rutas y el comportamiento de errores se recogen en [contratos de API](api-contracts.es.md). Los tipos locales de interfaz y llamadas genéricas `api<T>` son aserciones TypeScript, no validación de respuestas durante la ejecución. Los archivos de prueba contienen datos sintéticos; la observación sobre cerrar sesión mencionada más abajo solo usó mocks de rutas aislados en Playwright para mostrar una transición de estado de UI, no para afirmar que funcionase la base de datos.

## 4. Recorrido por la arquitectura

El [mapa vivo de arquitectura](architecture/architecture.es.md) es el diagrama principal del sistema. El repositorio es un monorepo `pnpm`: [apps/web](../apps/web/) gestiona UI React/Vite, pestañas, borradores, estilos y recorridos de navegador; [apps/api](../apps/api/) gestiona un proceso Fastify y los módulos `catalog`, `damage`, `teams` y `auth`; [packages/contracts](../packages/contracts/) exporta esquemas Zod de entrada y tipos seguros para el navegador. [app.ts](../apps/api/src/app.ts) registra rutas y compone el sistema. Algunos esquemas compartidos de petición se convierten en metadatos de ruta. Las respuestas y errores aún no están cubiertos uniformemente por OpenAPI.

El navegador llama a `/api` en el mismo origen. En desarrollo, [Vite](../apps/web/vite.config.ts) lo envía a Fastify; el [Dockerfile](../Dockerfile) compila la web y la API en una imagen y [app.ts](../apps/api/src/app.ts) puede servir la compilación web. El frontend usa estado y efectos React locales a componentes, sin gestor externo ni biblioteca de rutas en uso pese a la dependencia `react-router`. Dos borradores persisten en `localStorage`. Las lecturas API, la sesión y equipos guardados se consultan mediante [api.ts](../apps/web/src/lib/api.ts). La gestión de carga y fallos varía por pantalla (F06).

[Config](../apps/api/src/config.ts) valida las variables antes de iniciar el servidor. Fastify registra Helmet, límites generales de frecuencia, Swagger, delegación de Better Auth, rutas públicas y rutas de equipos protegidas por propietario. Better Auth usa tablas Prisma de usuarios, sesiones, cuentas y verificaciones en el [esquema](../apps/api/prisma/schema.prisma). El adaptador de equipos filtra por `ownerId` las consultas de lista y eliminación; las reglas de visibilidad del navegador no son un límite de autorización. Zod limita campos y el adaptador de daño valida nombres conocidos del catálogo. Hay varios formatos de error y la ruta Pokédex trata actualmente todas las excepciones como 400 (F03). Aún no hay contrato uniforme de error de API.

`@smogon/calc` fijado proporciona datos y daño de combate; [PokéAPI](../apps/api/src/modules/catalog/pokeapi-adapter.ts) solo aporta datos descriptivos. La caché usa `PokedexCache` y un límite de red de cuatro segundos; si falla la actualización se usan datos en caché de más de 24 horas sin mostrar que están obsoletos. Véase la [política de fuentes de datos](data-sources.es.md) para autoridad y límites.

Hay [pruebas Vitest de API](../apps/api/src/), una [prueba de tabla con Testing Library](../apps/web/src/type-chart.test.tsx) y dos [recorridos Playwright escritos](../apps/web/e2e/journeys.spec.ts). La [estrategia de pruebas](testing/test-strategy.es.md) registra una ejecución local histórica con 8 pruebas API y 1 web superadas; siguen pendientes la integración del adaptador de base de datos, pruebas de navegador en CI y comprobaciones de entrada del host. [Infra](../infra/) define tres proyectos Compose: Caddy compartido, aplicación/base de datos de staging privado y aplicación/base de datos de producción. Los listeners públicos 80/443 y loopback 18081/18082 de Caddy dirigen al API correspondiente; los archivos Compose inspeccionados no publican puertos del host para API ni base de datos. [ADR-005](adr/ADR-005-caddy-proxy-trust.es.md) describe el límite CIDR/cabeceras reenviadas. Los [flujos](../.github/workflows/) y [scripts de despliegue/copia](../infra/scripts/) codifican promoción por digest y recuperación local USB; [operaciones](operations.es.md) enumera la configuración externa y las pruebas pendientes.

En el host previsto, producción usa los puertos públicos 80/443 de Caddy, mientras Serve privado de staging y Funnel público reenvían a 18081 y 18082 del loopback del host. Caddy llega entonces al servicio Fastify correspondiente por el puerto de contenedor 4000; cada PostgreSQL escucha en 5432 solo dentro de la red de base de datos de su entorno. Esta auditoría no establece que los hostnames públicos o de tailnet de los archivos del host estén activos. [Operaciones](operations.es.md) requiere Docker Engine con Compose v2, Tailscale, restic, OpenSSH y curl en el mini PC; sus versiones instaladas exactas deben comprobarse allí.

## 5. Decisiones y autoridad

| Decisión | Implementación | Autoridad y alternativas descartadas | Revisión de la persona propietaria |
| --- | --- | --- | --- |
| Monolito modular y puertos selectivos | [Módulos API](../apps/api/src/modules/), `TeamStore`, `DamageCalculator` | [ADR-001](adr/ADR-001-modular-monolith.es.md) aceptado compara servicios separados, capas rígidas y ausencia de límites. | Revisar el acoplamiento real de módulos; no hace falta refactorizar capas especulativamente. |
| Autoridad de datos de combate/descriptivos | [catálogo](../apps/api/src/modules/catalog/catalog.ts), [daño](../apps/api/src/modules/damage/smogon-adapter.ts), [adaptador PokéAPI](../apps/api/src/modules/catalog/pokeapi-adapter.ts) | [ADR-002](adr/ADR-002-data-authority-and-provenance.es.md) aceptado descarta un modelo basado solo en PokéAPI y un calculador propio. | Validar las limitaciones y licencias de las fuentes antes de publicar. |
| Borradores en navegador y cuentas PostgreSQL/Prisma/Better Auth | [main.tsx](../apps/web/src/main.tsx), [esquema](../apps/api/prisma/schema.prisma), [auth](../apps/api/src/modules/auth/auth.ts) | [ADR-003](adr/ADR-003-private-teams-and-identity.es.md) aceptado compara almacenamiento solo en navegador, persistencia alternativa y autenticación propia. | Decidir verificación del correo y si se permiten equipos incompletos; corregir F01. |
| Imagen única, tres proyectos Compose, Caddy compartido y confianza controlada | [Dockerfile](../Dockerfile), [Compose/Caddy](../infra/), [ingress](../apps/api/src/ingress.ts) | [ADR-004](adr/ADR-004-compose-and-shared-caddy.es.md) y [ADR-005](adr/ADR-005-caddy-proxy-trust.es.md) aceptados comparan Kubernetes, imágenes/proxies separados, IP fija y confianza amplia en proxies. | Validar en el host la ruta real y el conflicto CSP de F02. |
| Promoción inmutable de staging a producción y puertas de recuperación USB | [flujos](../.github/workflows/), [deploy.sh](../infra/scripts/deploy.sh), [backup.sh](../infra/scripts/backup.sh) | [ADR-006](adr/ADR-006-immutable-release-and-recovery.es.md) aceptado compara recompilaciones, etiquetas mutables, recuperación solo de imagen y copias sin restauración. | Confirmar scripts del host, protección GitHub, entrada y restauración antes de publicar. |
| Pestañas en una página, conjuntos Pikachu/Charizard/Rayo predeterminados, comparación por cantidad/tipo y diseño actual del formulario | [main.tsx](../apps/web/src/main.tsx) | **Decisiones de implementación; no se encontró un ADR de interfaz aprobado ni análisis de alternativas.** Encajan con funciones generales, pero requisitos no las seleccionó explícitamente. | Validar personalmente la utilidad de la comparación, necesidad de enlaces profundos y claridad de valores ocultos que afectan al cálculo. No inferir un requisito de producto nuevo a partir de esta auditoría. |

Los planes aprobados seleccionan las decisiones principales sobre pila e infraestructura. La última fila identifica detalles concretos de diseño que parecen elegidos durante la implementación; no se debe inventar su justificación a posteriori.

## 6. Comparación con el plan

| Fuente | Evaluación |
| --- | --- |
| [Requisitos](requirements/requirements.es.md) | REQ-001–009 y 013 tienen implementación de respaldo, con los mismos límites de verificación que registra la especificación. REQ-010 y 014–017 siguen incompletos o sin verificar, tal como se indica. El comportamiento de biblioteca privada al cerrar sesión es una **desviación de requisito** (F01). |
| [Arquitectura](architecture/architecture.es.md) y [ADR](adr/) | Monorepo, división de módulos, autoridad de datos, persistencia y topología de entrada prevista concuerdan con los registros aceptados. La política actual de imágenes de Helmet entra en conflicto con los sprites remotos, una **desviación de arquitectura/configuración** (F02). El despliegue no se probó; no se confirma otra desviación de arquitectura del host. |
| [Plan de infraestructura](infrastructure/infrastructure-plan.es.md), [operaciones](operations.es.md) y diseño de publicación | Compose, Caddy, promoción por digest, wrapper SSH y scripts USB existen según lo previsto. No se afirma haber ejecutado mini PC, entrada pública, restauración ni flujo GitHub. Son **lagunas de verificación prevista**, no pruebas de despliegue contrario al plan. |
| [Plan de seguridad](security/security-plan.es.md) | Existen controles de cabeceras/borde, sesiones, límite de frecuencia y consultas filtradas por propietario. El plan reconoce que faltan protección CSRF propia y comprobaciones de host/cookies. F01 y F03 añaden comportamientos observados que requieren revisión. |
| [Estrategia de pruebas](testing/test-strategy.es.md) | Las pruebas existentes coinciden con los artefactos registrados en el plan. Faltan el adaptador de base de datos, pruebas entre cuentas, caché, navegador completo y verificación del host; es una carencia reconocida, no una divergencia documental. |

Diferencias adicionales clasificadas según las categorías solicitadas:

| Diferencia | Clasificación | Pruebas y valoración |
| --- | --- | --- |
| Las filas guardadas siguen visibles tras cerrar sesión | **Desviación de requisito** | F01; entra en conflicto con el comportamiento privado de [REQ-006](requirements/requirements.es.md#req-006) y la interfaz. |
| Ruta de sprite remoto de Pokédex frente a política de imágenes de Helmet | **Desviación de arquitectura** | F02; conflicto de política confirmado en respuesta local Fastify, efecto en navegador desplegado aún sin comprobar. |
| Siete pestañas en página sin URL propia | **Detalle de implementación inocuo** para el alcance actual | [main.tsx](../apps/web/src/main.tsx); no hay requisito aprobado de enlaces profundos. Reconsiderar solo si la persona propietaria necesita navegación por URL. |
| Comparación de equipos solo por cantidad/tipos y verificación condicional de SMTP | **Posible problema para revisión humana** | Son decisiones de implementación dentro de requisitos abiertos/amplios, no incumplimientos demostrados. |
| Ambigüedad de versión/fecha de la fuente de equipos profesionales | **Posible problema para revisión humana** | F12 ya aparece correctamente en [fuentes de datos](data-sources.es.md); no debe describirse como una nueva divergencia documental. |

En la revisión del commit inspeccionado no se encontró **ninguna divergencia documental confirmada** en los planes vivos. No hay hitos fechados que demuestren que la implementación vaya «por delante del plan»; la funcionalidad más amplia se describe en la sección 1. Una verificación pendiente no cuenta por sí sola como desviación.

## 7. Hallazgos que requieren revisión

«Acción justificada» significa que en el futuro hay que decidir, comprobar o corregir algo de forma específica. No se modificó automáticamente ningún hallazgo. Se distinguen inferencias estáticas de observaciones locales.

| ID | Hallazgo, archivos e impacto práctico | ¿Se justifica una acción? |
| --- | --- | --- |
| **F01 — alto** | En [main.tsx](../apps/web/src/main.tsx), `refreshSession` borra `user`, pero nunca `saved` al cerrar sesión o fallar la actualización; el constructor muestra `saved` incluso como invitado. Una prueba Playwright aislada con respuestas simuladas de cuenta/equipos mostró «Guest mode» **y** una fila privada ya cargada tras cerrar sesión. No intervino autorización de una base real. Esto expone a la siguiente persona que use esa sesión del navegador los datos de equipo ya obtenidos. | **Sí, antes de usar cuentas.** Borrar el estado privado de interfaz al terminar o cambiar sesión y verificar el ciclo completo. |
| **F02 — alto** | [app.ts](../apps/api/src/app.ts) registra valores predeterminados de Helmet. Una respuesta Fastify local incluía `Content-Security-Policy: ... img-src 'self' data:`; la [interfaz de Pokédex](../apps/web/src/main.tsx) muestra en un `img` la URL remota de sprite del adaptador. La política excluye esos sprites externos, por lo que la visualización prevista entra en conflicto con la cabecera configurada. No se ejecutó aquí la imagen de producción. | **Sí, antes de publicar.** Verificar un sprite real con la compilación/servidor estático y elegir una política de imagen suficientemente limitada o gestión de imágenes en mismo origen. |
| **F03 — medio** | [app.ts](../apps/api/src/app.ts) devuelve 400 y el mensaje de la excepción para cualquier error de Pokédex, incluidos fallos de base de datos. Sin PostgreSQL en esta auditoría, `/api/pokedex/Pikachu` devolvió 400 aunque Pikachu es válido. Se etiqueta incorrectamente una caída del servidor y quizá se revela texto interno. | **Sí.** Diferenciar especies desconocidas de fallos operativos y comprobar el cuerpo público del error. |
| **F04 — medio, inferido del código** | La [Pokédex](../apps/web/src/main.tsx) solicita datos al seleccionar, pero no cancela ni vincula la respuesta a la especie seleccionada. Un resultado anterior más lento puede establecer ID/sprite bajo el nuevo nombre y sus estadísticas Smogon. | **Sí.** Comprobar selecciones rápidas y protegerse de respuestas obsoletas. |
| **F05 — medio** | [Daño](../apps/web/src/main.tsx) conserva el último resultado al cambiar entradas; también envía naturaleza, nivel, EV/IV, modificadores, estado y tipo Teracristal desde el equipo, sin mostrar la mayoría en el formulario del calculador. El resultado visible puede corresponder a entradas anteriores o valores ocultos. | **Sí.** La persona propietaria debe validar el flujo previsto y después aclarar la procedencia de entradas/resultados. |
| **F06 — medio** | [main.tsx](../apps/web/src/main.tsx) ignora silenciosamente errores de solicitudes de tabla y equipos profesionales y no muestra carga explícita en esas pantallas. Solo catálogo establece un aviso genérico. Un fallo de red puede parecer una tabla o colección vacía. | **Sí.** Añadir estados de carga, vacío y error específicos después de definir los estados esperados. |
| **F07 — medio** | En [TeamEditor](../apps/web/src/main.tsx), los movimientos usan placeholders en vez de etiquetas asociadas, las etiquetas repetidas de estadísticas carecen de contexto `fieldset`/`legend` y el botón de navegación activa solo tiene una clase CSS. Esto puede hacer ambiguos los campos y la vista actual para tecnologías de asistencia. No se realizó una auditoría completa de accesibilidad. | **Sí.** Revisar con teclado/lector de pantalla y corregir la estructura de etiquetas confirmada. |
| **F08 — medio** | [main.tsx](../apps/web/src/main.tsx) declara manualmente `Catalog`, `ProTeam` y `SavedTeam`; [api.ts](../apps/web/src/lib/api.ts) confía en tipos genéricos de respuesta sin analizarla. Los [contratos](../packages/contracts/src/index.ts) cubren entradas y una respuesta de daño, pero no se aplican de forma coherente a respuestas. Los cuerpos de error varían, como indica [contratos de API](api-contracts.es.md). Los cambios pueden desincronizar API, interfaz y OpenAPI silenciosamente. | **Sí, junto con REQ-010.** Revisar contratos de respuesta y una estrategia de error; evitar una reescritura amplia solo por estilo de tipos. |
| **F09 — bajo/medio** | Las siete pantallas y sus estados/efectos están comprimidos en un [main.tsx](../apps/web/src/main.tsx) de unos 22 KB; la mayor parte del [style.css](../apps/web/src/style.css), de unos 9 KB, ocupa dos líneas largas. Esto dificulta revisiones centradas, cambios de accesibilidad y resolver conflictos. Los puertos aceptados `TeamStore` y `DamageCalculator` son finos, pero no hay pruebas de que deban eliminarse. | **Acción específica más adelante.** Separar solo límites reales de pantalla/estado al corregir comportamientos validados. No hace falta limpiar abstracciones especulativamente. |
| **F10 — alto** | Las [pruebas](../apps/api/src/) cubren cálculo, catálogo, CIDR y rutas inyectadas; la [prueba web unitaria](../apps/web/src/type-chart.test.tsx) cubre una fila de la tabla. Hay [recorridos Playwright](../apps/web/e2e/journeys.spec.ts), pero no cubren cierre de sesión, aislamiento entre cuentas, alternativa de caché ni todos los estados de invitado, y no hay ejecución CI registrada. No existen pruebas de integración del adaptador de base de datos. Las afirmaciones de datos privados y publicación tienen pocas pruebas. | **Sí, antes de publicar.** Añadir verificaciones según riesgo cuando la persona propietaria reproduzca el entorno y acepte el comportamiento previsto. |
| **F11 — alto, ya documentado** | [app.ts](../apps/api/src/app.ts) comprueba sesiones en POST/DELETE de equipos propios, pero no tiene protección explícita Origin/CSRF. El [plan de seguridad](security/security-plan.es.md#cookies-csrf-y-contenido-del-navegador) ya identifica la decisión pendiente; la gestión de rutas de autenticación de Better Auth no establece protección para estas rutas. | **Sí, antes de publicar.** La persona propietaria debe elegir la política de mutación; después hay que verificar peticiones de origen permitido y externo. |

No se demostró lógica de negocio duplicada perjudicial ni abstracción prematura clara más allá de F08/F09. La llamada entre módulos desde la validación de equipos a la validación de daño se reconoce explícitamente como límite pragmático en [ADR-001](adr/ADR-001-modular-monolith.es.md); refactorízala solo si las pruebas o cambios muestran un coste concreto.

## 8. Pruebas de frontend y límites

La habilidad `react-best-practices` orientó las comprobaciones de secuencia de peticiones, estado obsoleto y renderizado; `frontend-testing-debugging` orientó el flujo renderizado, consola, capturas y vista móvil. Su plugin Browser no estaba disponible, por lo que usé Playwright normal con Vite/Fastify local y Chrome headless instalado. No se modificó ninguna dependencia ni archivo de aplicación.

| Comprobación | Observación |
| --- | --- |
| Identidad/contenido/overlay | `http://127.0.0.1:5173/` tenía el título «Pokémon Tools», mostraba Overview y no presentó overlay del framework ni excepción de página en los recorridos comprobados. |
| Interacción | La tabla mostró 19 filas atacantes; añadir un equipo de invitado cambió el primero a 1/6 y sobrevivió a la recarga; al pulsar Calculate se obtuvo 68–84 PS, 44,4–54,9 % y 0 % de KO de un golpe en el ejemplo predeterminado Pikachu/Charizard. Se mostraron las dos tarjetas de equipos profesionales y el formulario de cuenta. |
| Adaptabilidad | A 390×844, Overview y el constructor vacío no desbordaron el ancho del documento. La navegación sí se desplaza horizontalmente (571 px de contenido en una vista de 346 px); quizá un usuario nuevo no descubra las vistas fuera de pantalla. No se probó toda la matriz de dispositivos ni tecnología de asistencia. |
| Consola | Un 404 correspondió a `/favicon.ico`. Seleccionar Pikachu también produjo 400 en la API de Pokédex porque la ejecución desechable no tenía PostgreSQL; las estadísticas base Smogon sí se mostraron. Esto no demuestra un comportamiento saludable de la caché descriptiva. |
| Estado privado de interfaz | Una prueba separada, expresamente **simulada**, de respuestas de autenticación/equipos confirmó F01 al cerrar sesión. No fue una prueba de autorización de base de datos. |

Se inspeccionaron localmente capturas de Overview de escritorio y de Overview/constructor móvil; son pruebas temporales de auditoría, no artefactos versionados. Siguen sin verificarse el registro de cuentas, persistencia, acceso entre cuentas, correo, respuestas reales de caché PokéAPI, CSP desplegada, todas las rutas de entrada y la suite Playwright completa existente.

## 9. Qué debe estudiar personalmente la persona propietaria

| Área y archivos | Comprender y poder explicar |
| --- | --- |
| [requisitos](requirements/requirements.es.md), [arquitectura](architecture/architecture.es.md) y [ADR](adr/) | ¿Qué funciones y decisiones de pila se aprobaron? ¿Qué entradas están implementadas o verificadas? ¿Por qué se eligieron monolito modular, jerarquía de fuentes, persistencia privada, Compose/Caddy, confianza de proxy y promoción inmutable? |
| [main.tsx](../apps/web/src/main.tsx), [api.ts](../apps/web/src/lib/api.ts), [contratos](../packages/contracts/src/index.ts) | ¿Cómo interactúan el estado de pestañas, borradores persistentes, estado de cuenta y llamadas API? ¿Qué significa exactamente «comparación»? ¿Qué campos de equipo afectan al daño sin aparecer en el formulario? ¿Por qué ocurre F01? |
| [app.ts](../apps/api/src/app.ts), [auth.ts](../apps/api/src/modules/auth/auth.ts), [adaptador de equipo](../apps/api/src/modules/teams/prisma-adapter.ts) | ¿Dónde se comprueba la autenticación y dónde se filtra por propietario? ¿Qué respuestas/errores los genera el código propio frente a las bibliotecas? ¿Qué debe ocurrir al cerrar sesión o recibir una mutación de otro origen? |
| [catálogo](../apps/api/src/modules/catalog/catalog.ts), [adaptador PokéAPI](../apps/api/src/modules/catalog/pokeapi-adapter.ts), [adaptador de daño](../apps/api/src/modules/damage/smogon-adapter.ts), [fuentes de datos](data-sources.es.md) | ¿Qué hechos están fijados, en caché, consultados externamente o seleccionados manualmente? ¿Cómo se manifiestan para la persona usuaria una forma no asignada, una caída o un conflicto de fuentes? |
| [esquema/migración](../apps/api/prisma/), [estrategia de pruebas](testing/test-strategy.es.md), [recorridos de navegador](../apps/web/e2e/journeys.spec.ts) | ¿Qué persiste y qué se genera? ¿Qué requisitos de aceptación tienen pruebas ejecutadas reales y cómo reproducir una comprobación de cuenta y entre cuentas? |
| [Dockerfile](../Dockerfile), [infraestructura](../infra/), [flujos](../.github/workflows/) y [operaciones](operations.es.md) | Sigue una petición por Caddy hasta Fastify y una imagen desde staging a producción. ¿Qué debe configurarse manualmente en el mini PC y GitHub? ¿Qué recupera una reversión de imagen y qué necesita restaurar la base de datos? |
| [AGENTS.md](../AGENTS.md), [habilidades del repositorio](../.agents/skills/) y [metodología de IA](tfm/ai-methodology/README.es.md) | ¿Qué reglas distinguen decisiones aprobadas de inferencias de IA? ¿Qué decisiones de la construcción inicial tienen registros persistentes y dónde registrar revisiones/correcciones posteriores? |

## 10. Próximos pasos recomendados

1. Lee el índice de requisitos y los ADR; después recorre las siete pantallas con esta auditoría. Anota qué decisiones de implementación aceptas o cuestionas.
2. Instala o habilita pnpm 11.19, prepara PostgreSQL 18 y reproduce el inicio local con tu propio `.env`; confirma la migración inicial y que no haya secretos reales en Git.
3. Prueba personalmente los flujos de invitado de tabla/Pokédex/constructor/daño/equipos profesionales y después el ciclo de cuenta completo con dos cuentas distintas. Incluye cerrar sesión, recarga y visibilidad de equipos privados.
4. Valida los límites de arquitectura con la base en ejecución y, más adelante, la imagen compilada: datos por propietario, autoridad de fuentes, CSP/sprites, errores y cadena de confianza Caddy/borde.
5. Decide cuestiones abiertas de producto/seguridad: equipos incompletos guardados, verificación de correo, significado de la comparación, política CSRF de rutas propias y redacción de fechas/fuentes de equipos profesionales.
6. Corrige primero las desviaciones de comportamiento/configuración confirmadas (en especial F01 y F02/F03); después haz solo refactorizaciones de UI/contratos justificadas por esos arreglos.
7. Añade pruebas de riesgo pendientes para base de datos, caché, cuentas, navegador y host; ejecuta las puertas de calidad existentes y conserva los resultados.
8. Actualiza requisitos vivos y documentos de API, seguridad y operaciones solo cuando cambien decisiones o pruebas. Esta auditoría fechada debe seguir siendo una instantánea.

Son seguimientos propuestos bajo responsabilidad de la persona propietaria; esta auditoría no los ha ejecutado.

## 11. Lista manual de comprobación

- [ ] Lee [REQ-001–017](requirements/requirements.es.md) y marca qué comprobaciones de aceptación has observado personalmente.
- [ ] Lee los seis [ADR](adr/) y explica con tus propias palabras cada alternativa elegida.
- [ ] Confirma que `node --version` cumple el rango y que `pnpm --version` es `11.19.0`.
- [ ] Inicia PostgreSQL 18, crea la base local, copia/edita `apps/api/.env` y ejecuta `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm db:migrate` y `pnpm dev`.
- [ ] Abre `http://127.0.0.1:5173/`; revisa las siete pestañas, el sentido de la tabla, navegación móvil y campos adaptables del constructor.
- [ ] Selecciona Pokémon normales y con guion/forma en la Pokédex; inspecciona estadísticas base, datos descriptivos alternativos, sprite y consola del navegador.
- [ ] Edita los dos borradores de invitado, llega a seis miembros, compáralos, recarga y verifica las dos claves de almacenamiento local.
- [ ] Calcula daño y después cambia entradas antes de volver a calcular; inspecciona qué valores describe realmente el resultado.
- [ ] Crea dos cuentas de prueba en una base **local**; guarda, reabre, lista y elimina equipos; comprueba IDs entre cuentas y visibilidad tras cerrar sesión. Decide la política para equipos incompletos y verificación de correo.
- [ ] Compara ambos registros de equipos profesionales con los informes/publicaciones enlazados y resuelve las cuestiones documentadas de versión/fecha de fuente.
- [ ] Inspecciona `/api/health`, `/docs` y `/docs/json`; compara las respuestas reales de éxito/error con el contrato generado.
- [ ] Ejecuta `pnpm db:validate`, `pnpm build`, `pnpm check`, `pnpm lint`, `pnpm test` y `pnpm config:check`; registra versiones y fallos.
- [ ] Si hace falta, instala Chromium de Playwright; luego ejecuta `pnpm test:e2e` con PostgreSQL y `.env` local disponibles.
- [ ] Revisa el [plan de seguridad](security/security-plan.es.md) y decide cómo rechazar peticiones entre orígenes en mutaciones propias de equipos.
- [ ] Antes de cualquier publicación pública, sigue [operaciones](operations.es.md) en el mini PC: redes Compose, cabeceras Caddy/Tailscale, cookies, HTTPS externo, protección GitHub, promoción por digest y puertas de copia/restauración USB.
- [ ] Detén servicios locales con Ctrl+C y para el contenedor de base opcional; restablece solo los datos de desarrollo desechables previstos.

## 12. Resumen de auditoría

El repositorio es una **implementación local amplia de primera versión con rutas de base de datos, CI y producción sin verificar**. La persona propietaria debería centrarse primero en comprender el alcance aprobado, reproducir el entorno, validar la privacidad de cuentas y el comportamiento de las fuentes, y revisar decisiones de interfaz/seguridad tomadas durante la implementación. Esta auditoría registra **12 hallazgos que requieren revisión (F01–F12)**, entre ellos **1 desviación de arquitectura/configuración confirmada** (conflicto entre sprite y CSP), **1 desviación de comportamiento de requisito** (filas privadas después del cierre de sesión) y **0 divergencias documentales confirmadas**. La primera acción concreta personal es: **leer el [índice de requisitos](requirements/requirements.es.md) y marcar qué comprobaciones de aceptación has visto superar personalmente**.
