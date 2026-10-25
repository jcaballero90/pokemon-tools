[![English](https://img.shields.io/badge/lang-en-red.svg)](requirements.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](requirements.es.md)

# Requisitos de Pokémon Tools: MVP actual

**Revisión: 25-10-2026; código base: 38ae16a.** Esta especificación consolida las peticiones aprobadas por el propietario y las contrasta con el código, contratos, pruebas y configuración actuales. Conserva REQ-001 a REQ-020 y añade los comportamientos aprobados que aún no tenían requisito propio. La implementación sirve para describir el estado; no convierte por sí sola una posibilidad técnica en un compromiso nuevo.

## Resultado de la revisión

| Situación anterior | Adaptación al MVP actual |
| --- | --- |
| REQ-001 a REQ-020 definidos, pero con evidencia antigua. | Se conservan sus identificadores y se concretan criterios y límites de verificación. |
| Comparación descrita como función genérica de dos equipos. | REQ-022 y REQ-023 especifican A vs B, Velocidad y transferencia a Daño. |
| Importación/exportación y controles numéricos sin requisito propio. | REQ-021 y REQ-024 recogen formato, límites, errores y valores heredados. |
| Cuenta descrita solo con correo y biblioteca dentro de Cuenta. | REQ-006 y REQ-025 a REQ-027 recogen username, biblioteca independiente, controles A/B y carné de Entrenador. |
| Fuentes resumidas como Smogon y PokéAPI con caché. | REQ-009 diferencia motor, instantáneas JSON, consultas externas y caché PostgreSQL. |
| Inicio, marca, temas y móvil sin requisito explícito. | REQ-028 y REQ-029 recogen las peticiones de presentación y navegación. |
| Dudas sobre tamaño del equipo y verificación de correo. | Se documenta el comportamiento actual: cero a seis sets válidos; verificación condicionada a SMTP. |

**Estados:** «Implementado» indica comportamiento localizado en código, con pruebas cuando se citan; no significa aceptación completa en producción. «Configurado» indica workflows/scripts que requieren comprobar ejecución y ajustes externos. «Parcial» señala verificación incompleta. «Retirado» conserva trazabilidad sin pertenecer al MVP. Las pruebas escritas no equivalen a pruebas ejecutadas.

**Evidencia de esta revisión:** compilación de contratos y Vitest satisfactorios: **54 pruebas API en 11 archivos, 170 web en 23 archivos y 6 de contratos en 2 archivos: 230 en total**. El comando pnpm test no pudo obtener el bloqueo del almacén en AppData; se ejecutaron directamente con Node los binarios instalados de TypeScript y Vitest. No se han repetido Playwright, build de producción, despliegues ni comprobaciones del mini PC. La [estrategia de pruebas](../testing/test-strategy.es.md) conserva evidencia histórica y sus límites.

## Índice

Todos los requisitos activos pertenecen al MVP aprobado. El campo «Alcance» sustituye las prioridades «sin decidir»: identifica compromisos de esta entrega sin inventar un orden relativo de producto.

| ID | Título | Tipo | Alcance | Estado |
| --- | --- | --- | --- | --- |
| [REQ-001](#req-001) | Alcance de novena generación | Restricción | MVP | Implementado |
| [REQ-002](#req-002) | Tabla defensiva de tipos | Funcional | MVP | Implementado |
| [REQ-003](#req-003) | Ficha y estadísticas de Pokémon | Funcional | MVP | Implementado |
| [REQ-004](#req-004) | Daño y condiciones de combate | Funcional | MVP | Implementado |
| [REQ-005](#req-005) | Borradores independientes A/B | Funcional | MVP | Implementado |
| [REQ-006](#req-006) | Cuenta y propiedad de equipos | Funcional | MVP | Implementado |
| [REQ-007](#req-007) | Contratos y nombres válidos | Funcional | MVP | Implementado |
| [REQ-008](#req-008) | Equipos profesionales | Funcional | Retirado | Retirado |
| [REQ-009](#req-009) | Fuentes, instantáneas y caché | Restricción | MVP | Implementado |
| [REQ-010](#req-010) | Contratos y documentación API | Restricción | MVP | Implementado; verificar despliegue |
| [REQ-011](#req-011) | Seguridad y sesiones | No funcional | MVP | Implementado; verificar despliegue |
| [REQ-012](#req-012) | Entrada y confianza del proxy | Restricción | MVP | Configurado; verificar host |
| [REQ-013](#req-013) | Monorepo y tecnologías | Restricción | MVP | Implementado |
| [REQ-014](#req-014) | GitHub Actions | No funcional | MVP | Configurado; verificar ajustes GitHub |
| [REQ-015](#req-015) | Promoción por digest y reversión | Restricción | MVP | Configurado; verificar recuperación |
| [REQ-016](#req-016) | Copias y restauración | No funcional | MVP | Configurado; verificar host |
| [REQ-017](#req-017) | Verificación de recorridos | No funcional | MVP | Parcial: pruebas locales; host pendiente |
| [REQ-018](#req-018) | Inglés y español de España | Funcional | MVP | Implementado |
| [REQ-019](#req-019) | Navegación y movimientos de Pokédex | Funcional | MVP | Implementado |
| [REQ-020](#req-020) | Rutas directas y SEO básico | Funcional | MVP | Implementado; verificar origen desplegado |
| [REQ-021](#req-021) | Importación/exportación Showdown | Funcional | MVP | Implementado |
| [REQ-022](#req-022) | A vs B, balance y Velocidad | Funcional | MVP | Implementado |
| [REQ-023](#req-023) | Transferencia a Daño | Funcional | MVP | Implementado |
| [REQ-024](#req-024) | Edición numérica y herencia | Funcional | MVP | Implementado |
| [REQ-025](#req-025) | Acceso con username o correo | Funcional | MVP | Implementado |
| [REQ-026](#req-026) | Biblioteca y controles A/B | Funcional | MVP | Implementado |
| [REQ-027](#req-027) | Carné y acceso a biblioteca | Funcional | MVP | Implementado |
| [REQ-028](#req-028) | Inicio, navegación y marca | Funcional | MVP | Implementado |
| [REQ-029](#req-029) | Temas, móvil y teclado | No funcional | MVP | Implementado; revisión visual pendiente |

## Detalle de requisitos

### REQ-001

**La entrega ofrecerá herramientas basadas en el motor de novena generación, sin simular combates completos.**

- **Origen:** plan de publicación aprobado y cierre del MVP solicitado por el propietario.
- **Aceptación:** tabla de tipos, Pokédex, equipos, comparación, Daño, Cuenta y biblioteca privada disponibles en inglés y es-ES. El motor usa generación 9; los repertorios de movimientos identifican expresamente el juego base Escarlata/Púrpura. Una entrada del catálogo no garantiza disponibilidad en esos juegos ni legalidad competitiva.
- **Evidencia:** [catálogo](../../apps/api/src/modules/catalog/catalog.ts), [contratos](../../packages/contracts/src/index.ts) y [rutas](../../apps/web/src/lib/pokedex-routes.ts).

### REQ-002

**La tabla mostrará la efectividad defensiva combinada de uno o dos tipos.**

- **Origen:** petición aprobada de tabla defensiva.
- **Aceptación:** selección manual limitada a dos tipos o especie que rellene sus tipos; agrupar todos los tipos atacantes por multiplicador, incluidas inmunidades. Planta/Tierra recibe 4× de Hielo, 2× de Bicho/Fuego/Volador, 0,5× de Tierra/Roca y 0× de Eléctrico. El buscador mantiene nombre accesible aunque se retire su etiqueta visible redundante.
- **Evidencia:** [prueba de interfaz](../../apps/web/src/type-chart.test.tsx), [catálogo](../../apps/api/src/modules/catalog/catalog.test.ts) y [recorrido visitante](../../apps/web/e2e/journeys.spec.ts).

### REQ-003

**La ficha mostrará estadísticas base y detalles descriptivos disponibles de la especie o forma elegida.**

- **Origen:** plan de producto y mejoras aprobadas de Pokédex.
- **Aceptación:** estadísticas y tipos de combate disponibles aunque falle PokéAPI; habilidades con ayuda accesible, imágenes y familia evolutiva cuando existan. Indicar datos ausentes sin sustituir formas. Las respuestas antiguas no reemplazan una selección posterior.
- **Evidencia:** [Pokédex](../../apps/web/src/features/pokedex/Pokedex.tsx), [adaptador](../../apps/api/src/modules/catalog/pokeapi-adapter.ts), [pruebas del adaptador](../../apps/api/src/modules/catalog/pokeapi-adapter.test.ts) y [regresiones web](../../apps/web/src/app-behavior.test.tsx).

### REQ-004

**Daño calculará un movimiento contra un objetivo y mostrará intervalo en PS y porcentaje y probabilidad de debilitamiento de un golpe condicionada al acierto.**

- **Origen:** plan aprobado y ampliaciones de condiciones de combate.
- **Aceptación:** usar los sets y condiciones expuestos: Individuales/Dobles, clima, terreno, pantallas, Refuerzo, Compiescolta, crítico, Trampa Rocas, Púas y Teracristalización por lado. Conservar nivel, objeto, habilidad, naturaleza, EV/IV, modificadores y estado. Validar antes de enviar, informar de errores y ocultar resultados anteriores al editar o volver a entrar. La probabilidad no incluye precisión ni constituye una simulación de turnos.
- **Evidencia:** [adaptador Smogon](../../apps/api/src/modules/damage/smogon-adapter.ts), [pruebas de daño](../../apps/api/src/modules/damage/damage.test.ts), [Daño](../../apps/web/src/features/damage/Damage.tsx) y [recorridos](../../apps/web/e2e/journeys.spec.ts).

### REQ-005

**Visitantes y usuarios autenticados podrán editar dos borradores independientes de hasta seis Pokémon.**

- **Origen:** plan aprobado de equipos A/B y persistencia.
- **Aceptación:** conservar nombre, notas y todos los campos del set; permitir cero a seis integrantes y cuatro posiciones de movimientos. Mantener ediciones incompletas, huecos y asociaciones opcionales con equipos guardados al recargar; migrar formatos antiguos compatibles. Si falla el almacenamiento, informar y permitir editar. Cerrar sesión conserva el contenido local y elimina su asociación privada.
- **Evidencia:** [persistencia](../../apps/web/src/lib/team-drafts.ts), [pruebas de borradores](../../apps/web/src/lib/team-drafts.test.ts), [contratos](../../packages/contracts/src/index.ts) y [recorrido de recarga](../../apps/web/e2e/journeys.spec.ts).

### REQ-006

**Cada cuenta tendrá sesión y acceso exclusivo a sus propios equipos guardados.**

- **Origen:** plan de cuentas privadas y posterior ampliación de actualización.
- **Aceptación:** registro, inicio/cierre de sesión y listado, creación, actualización y eliminación mediante sesión. El propietario procede de la sesión, nunca del cuerpo recibido. Actualización atómica por propietario; ID ajeno o inexistente devuelve el mismo 404 team-not-found. Se admite equipo vacío si el resto del contrato es válido; no se admite un set con especie o valores inválidos.
- **Evidencia:** [rutas](../../apps/api/src/app.ts), [almacén Prisma](../../apps/api/src/modules/teams/prisma-adapter.ts), [pruebas de propiedad](../../apps/api/src/modules/teams/prisma-adapter.test.ts) y [recorrido con dos cuentas](../../apps/web/e2e/journeys.spec.ts).

### REQ-007

**Las acciones definitivas validarán estructura, catálogo y números sin certificar legalidad de torneo.**

- **Origen:** plan aprobado de entradas legales.
- **Aceptación:** validar antes de guardar, exportar, calcular o transferir; permitir texto parcial al editar y mostrar errores localizados al salir del campo o actuar. Especie y naturaleza conocidas; objeto, habilidad, teratipo y huecos de movimientos pueden quedar vacíos cuando son opcionales. Convertir selecciones traducidas a valores canónicos. El servidor repite validación para guardar/calcular. Conservar borradores antiguos inválidos y bloquear acciones afectadas hasta corregirlos.
- **Evidencia:** [Zod](../../packages/contracts/src/index.ts), [validación web](../../apps/web/src/features/teams/set-validation.ts), [pruebas](../../apps/web/src/features/teams/set-validation.test.ts) y [validación API](../../apps/api/src/modules/damage/smogon-adapter.ts).

| Campo | Límite |
| --- | --- |
| Nivel | Entero 1–100 |
| EV por estadística / total por Pokémon | Entero 0–252 / suma máxima 510 |
| IV | Entero 0–31 |
| Modificadores | Entero −6 a +6 |
| Capas de Púas | Entero 0–3 |
| Equipo / movimientos al enviar | 0–6 integrantes / 0–4 movimientos no vacíos |
| Nombre del equipo / notas | 1–80 caracteres / hasta 2000, según contrato |

### REQ-008

**Retirado:** la pestaña, endpoint y registros de equipos profesionales ya no pertenecen al producto. Se conserva el identificador por trazabilidad. No hay aceptación pendiente de esta función.

### REQ-009

**Diferenciar motor de combate, instantáneas locales y consultas descriptivas con caché.**

- **Origen:** decisión aprobada de autoridad de datos y mejoras de Pokédex/localización.
- **Aceptación:** @smogon/calc fijado aporta catálogo y mecánicas de generación 9. Los JSON versionados aportan equivalencias de especies/formas, identificadores, nombres traducidos, descripciones de habilidades y repertorios del juego base Escarlata/Púrpura, con revisión de origen registrada. PokéAPI aporta detalles y evolución bajo demanda. PokedexCache guarda datos descriptivos y URL de imágenes con frescura de 24 horas y reutilización obsoleta señalada si falla la fuente. No guarda los bytes de las imágenes ni alimenta el cálculo de daño.
- **Evidencia:** [generador](../../apps/api/scripts/generate-pokedex-identities.mjs), [catálogo](../../apps/api/src/modules/catalog/catalog.ts), [movimientos locales](../../apps/api/src/modules/catalog/pokedex-moves.ts), [caché](../../apps/api/src/modules/catalog/pokeapi-adapter.ts) y [Prisma](../../apps/api/prisma/schema.prisma). Las pruebas simulan fuente y almacén; no acreditan disponibilidad externa real.

### REQ-010

**El navegador y la API compartirán contratos y solicitudes del mismo origen.**

- **Origen:** arquitectura aprobada.
- **Aceptación:** rutas /api, validación Zod de entradas/respuestas de funciones y OpenAPI de rutas propias, incluido PUT /api/me/teams/:id. Interfaz /docs disponible en desarrollo/staging y deshabilitada en producción. Better Auth mantiene sus rutas comodín delegadas, sin atribuirles documentación individual que no existe.
- **Evidencia:** [cliente](../../apps/web/src/lib/api.ts), [pruebas de composición](../../apps/api/src/app.test.ts) y [contratos HTTP](../api-contracts.es.md). Pendiente: confirmar origen y exposición en el despliegue.

### REQ-011

**Proteger sesiones, entradas y datos privados con controles proporcionados al MVP.**

- **Origen:** plan de seguridad y ampliaciones de cuentas.
- **Aceptación:** cookies seguras bajo HTTPS, Helmet/CSP, límite de solicitudes y límites Better Auth. Crear/actualizar/eliminar equipos exige Origin exacto de confianza y sesión. Registros y errores inesperados no revelan secretos/tokens; descartar datos privados de sesiones anteriores. El límite superior de NODE_ENV=test no modifica las 120 solicitudes por minuto de producción.
- **Evidencia:** [API](../../apps/api/src/app.ts), [orígenes](../../apps/api/src/origins.test.ts), [registros](../../apps/api/src/logger.test.ts) y [seguridad](../security/security-plan.es.md). Pendiente: cookies, cabeceras y límites a través del despliegue real.

### REQ-012

**Caddy será el proxy de entrada y la ruta de confianza para cabeceras reenviadas.**

- **Origen:** arquitectura y decisión aprobada de confianza del proxy.
- **Aceptación:** staging privado por Tailscale Serve y producción HTTPS; Funnel como alternativa pública prevista. Comprobar el par real del socket, rechazar pares ajenos al borde y sanear IP/host/protocolo. Fastify no publica puerto del host; separar redes, bases y cookies por entorno. No depender de IP fija de contenedor Caddy.
- **Evidencia:** [entrada](../../apps/api/src/ingress.ts), [pruebas](../../apps/api/src/ingress.test.ts), [Caddyfile](../../infra/caddy/Caddyfile) y [operaciones](../operations.es.md). La accesibilidad comunicada por el propietario no demuestra las pruebas de suplantación o aislamiento del host.

### REQ-013

**Mantener un monorepo pnpm y una imagen común para interfaz y API.**

- **Origen:** tecnologías y arquitectura aprobadas.
- **Aceptación:** TypeScript, React/Vite y React Router, Fastify 5, Zod 4, Better Auth, Node 24, Prisma 7 y PostgreSQL 18. Contratos en packages/contracts, interfaz en apps/web y API en apps/api, con versiones fijadas por manifiestos/lockfile. Docker compila y ejecuta ambas partes con usuario de aplicación no root y configuración/base separadas por entorno.
- **Evidencia:** [manifiesto](../../package.json), [Dockerfile](../../Dockerfile), [staging](../../infra/compose/staging.yaml) y [producción](../../infra/compose/production.yaml). Esta revisión no recompila ni inicia la imagen.

### REQ-014

**GitHub Actions distinguirá comprobación de cambios y despliegue.**

- **Origen:** flujo aprobado de ramas y automatismos.
- **Aceptación:** Checks y CodeQL en PR hacia development/staging/main y pushes a esas ramas; no por push aislado a una rama de trabajo. Checks usa PostgreSQL 18 temporal, instalación congelada, Prisma, build, tipos/textos UI, lint, configuración, unitarias, migraciones y Playwright. Promotion source exige staging del mismo repositorio en PR a main. CodeQL y Dependabot incluyen ejecución semanal. Despliegues esperan Checks satisfactorio de un push de su rama, no de una PR.
- **Evidencia:** [Checks](../../.github/workflows/checks.yml), [CodeQL](../../.github/workflows/codeql.yml), [Promotion source](../../.github/workflows/promotion-source.yml) y [Dependabot](../../.github/dependabot.yml). docs:check existe pero no está incluido en Checks. Pendiente: reglas obligatorias y ajustes reales de GitHub, que el YAML no impone por sí solo.

### REQ-015

**Producción reutilizará la imagen validada en staging y podrá recuperar la anterior sin revertir datos.**

- **Origen:** plan aprobado de publicación inmutable.
- **Aceptación:** staging construye/publica en GHCR, despliega digest, aplica migraciones y prueba salud, catálogo, OpenAPI y daño por la ruta privada. Confirma commit/árbol/digest solo tras pasar humo. Producción comprueba árbol coincidente y usa el mismo digest sin recompilar. Un fallo recupera la aplicación anterior; rollback manual recrea solo aplicación. Las migraciones deben ser compatibles con la imagen anterior. La aprobación humana requiere configurar efectivamente el entorno y las reglas GitHub.
- **Evidencia:** [staging](../../.github/workflows/staging.yml), [producción](../../.github/workflows/production.yml) y [despliegue](../../infra/scripts/deploy.sh). Hay éxitos comunicados por el propietario; faltan evidencias revisadas de rollback, fallo de staging y aprobación obligatoria.

### REQ-016

**PostgreSQL de producción tendrá copias cifradas diarias y previas a migración y restauración comprobable.**

- **Origen:** plan aprobado de recuperación en USB.
- **Aceptación:** timer diario de producción y copia previa a migrar; staging admite copia/restauración manual. Restic guarda volcado cifrado en USB y se detiene sin montaje. Restaurar en base desechable, consultar datos y eliminarla. Promoción exige marcadores de entrada pública y restauración; los marcadores no sustituyen las comprobaciones. No prometer copia externa ni tiempos no medidos.
- **Evidencia:** [copia](../../infra/scripts/backup.sh), [restauración](../../infra/scripts/restore-drill.sh), [timer](../../infra/systemd/pokemon-backup.timer) y [servicio](../../infra/systemd/pokemon-backup.service). El propietario comunicó copia/restauración satisfactorias; esta revisión no prueba USB ni host.

### REQ-017

**La aceptación conservará evidencia de pruebas y sus límites.**

- **Origen:** plan de calidad y petición de cerrar el MVP con sus pruebas.
- **Aceptación:** unitarias/componentes para reglas/estados, integración PostgreSQL para cuentas/propiedad, Playwright para recorridos y pruebas de host para entrada/recuperación. El runner E2E debe terminar con código cero. Distinguir mocks de integración real y pruebas escritas de ejecutadas. Registrar fecha, ámbito y fallos; no afirmar ausencia de errores ni cobertura total de mecánicas.
- **Evidencia:** [estrategia](../testing/test-strategy.es.md), [E2E](../../apps/web/e2e/journeys.spec.ts) y [runner](../../apps/web/scripts/run-e2e.mjs). Esta revisión acredita las unitarias indicadas al inicio; la estrategia registra 12 recorridos satisfactorios el 24-10-2026, no repetidos ahora. Host pendiente.

### REQ-018

**Ofrecer inglés y español de España conservando identificadores canónicos.**

- **Origen:** plan bilingüe aprobado.
- **Aceptación:** preferencia guardada, idioma del navegador y fallback inglés; variantes españolas seleccionan es-ES. Cambiar idioma actualiza textos/mensajes/metadatos sin perder formularios, borradores, selección o sesión. Recursos equivalentes EN/ES y terminología Pokémon respaldada por catálogo, usando idioma 7 de PokéAPI y no es-419.
- **Evidencia:** [idioma](../../apps/web/src/i18n.test.ts), [etiquetas](../../apps/web/src/lib/catalog-labels.test.ts), [pseudolocalización](../../apps/web/src/pseudolocale-app.test.tsx) y [auditoría de textos](../../apps/web/scripts/check-ui-literals.mjs). Estas pruebas no sustituyen revisión lingüística humana.

### REQ-019

**La Pokédex buscará el catálogo completo y mostrará movimientos disponibles del juego base Escarlata/Púrpura.**

- **Origen:** mejoras aprobadas de lista, movimientos y evoluciones.
- **Aceptación:** orden nacional con forma base antes de alternativas; búsqueda canónica/localizada sin depender del límite visible y carga progresiva accesible. Movimientos por método con nombre, tipo/categoría y nivel/MT disponible. Indicar versión y datos ausentes; excluir DLC y no inferir progenitores Huevo ni legalidad del set.
- **Evidencia:** [lista](../../apps/web/src/pokedex-list.test.tsx), [movimientos UI](../../apps/web/src/pokedex-moves.test.tsx), [movimientos API](../../apps/api/src/modules/catalog/pokedex-moves.test.ts) y [E2E Pokédex](../../apps/web/e2e/pokedex-redesign.spec.ts).

### REQ-020

**Cada entrada apta tendrá URL estable y metadatos básicos localizados.**

- **Origen:** plan aprobado de rutas y SEO básico.
- **Aceptación:** slug sin colisiones, navegación directa, recarga, historial y canónica; título/descripción localizados, sitemap y robots según origen/entorno. Slug desconocido devuelve HTTP 404 y contenido localizado. No garantizar indexación/posicionamiento ni atribuir renderizado de metadatos en servidor.
- **Evidencia:** [rutas](../../apps/web/src/lib/pokedex-routes.test.ts), [sitemap/fallback](../../apps/api/src/app.test.ts) y [regresiones](../../apps/web/src/app-behavior.test.tsx). Pendiente verificar origen canónico desplegado.

### REQ-021

**Ambos editores importarán y exportarán formato Pokémon Showdown.**

- **Origen:** intercambio de equipos aprobado y plan de validación.
- **Aceptación:** previsualizar y aplicar importación válida; rechazar nombres, números, sintaxis o tamaño fuera de límites e informar de campos no conservables. Exportar el borrador validado con nombres canónicos, ceros explícitos y convenciones Showdown. No generar un paste inválido ni certificar legalidad competitiva.
- **Evidencia:** [importación](../../apps/web/src/features/teams/showdown-import.test.ts), [exportación](../../apps/web/src/features/teams/showdown-export.test.ts), [componente](../../apps/web/src/features/teams/ShowdownTeamExport.test.tsx) y [recorrido](../../apps/web/e2e/journeys.spec.ts).

### REQ-022

**La comparación abrirá A vs B por defecto y conservará Balance de equipo.**

- **Origen:** plan aprobado de comparación.
- **Aceptación:** alternar A→B/B→A, usar ataques seleccionados y mostrar el de mayor efectividad de tipos por celda, con diagnósticos de datos incompletos/movimientos omitidos; retirar las dos tarjetas de resumen. Balance informa de debilidades/resistencias/inmunidades y huecos. Tabla e indicadores ↑/↓/=/ ? de Velocidad usan nivel, EV/IV y naturaleza, excluyendo objetos, habilidades, estado, modificadores y campo; invertir dirección invierte la referencia.
- **Evidencia:** [modelo](../../apps/web/src/features/teams/comparison-model.test.ts), [interfaz](../../apps/web/src/features/teams/Compare.test.tsx) y [E2E](../../apps/web/e2e/team-comparison.spec.ts). La efectividad no incorpora STAB ni equivale a daño real, éxito o K.O.

### REQ-023

**Cada celda utilizable abrirá el par exacto en Daño mediante las espadas.**

- **Origen:** plan aprobado de comparación a Daño.
- **Aceptación:** etiqueta/ayuda localizada y bloqueo explicado si algún set es inválido o no hay movimiento. Resolver por equipo/posición, también con especies repetidas. Copiar especie, mote, nivel, objeto, habilidad, naturaleza, movimientos, EV/IV, modificadores, estado y teratipo con el movimiento canónico mostrado. Mostrar resúmenes; iniciar campo neutro, Teracristalización inactiva, ajustes EV/IV vacíos y sin resultado. Consumir una vez cada transferencia, admitir otras nuevas, no calcular automáticamente y no modificar borradores.
- **Evidencia:** [copia tipada](../../apps/web/src/features/teams/team-model.ts), [celdas](../../apps/web/src/features/teams/TeamMatchup.tsx), [Daño](../../apps/web/src/features/damage/Damage.tsx) y [pruebas de slots/duplicados/dirección](../../apps/web/src/features/teams/Compare.test.tsx).

### REQ-024

**La edición numérica impedirá valores inválidos sin confundir vacío con cero.**

- **Origen:** plan aprobado de entradas legales y herencia.
- **Aceptación:** limitar enteros inmediatamente a REQ-007; limitar el EV editado al presupuesto restante de 510 sin cambiar otros. Mostrar total y explicación. Rechazar decimales/formato erróneo con ayuda; permitir vaciado temporal y restaurar último valor válido obligatorio al perder foco. En Daño, placeholders 0–252/0–31, herencia visible y cero explícito conservado. Vacío hereda; si borrar excede presupuesto, mantener el ajuste explícitamente limitado y explicarlo. Conservar valores antiguos inválidos y bloquear acciones hasta corregirlos.
- **Evidencia:** [control entero](../../apps/web/src/components/bounded-integer-input.test.tsx), [ajustes heredados](../../apps/web/src/features/damage/damage-spreads.test.ts) y [regresiones EV/IV](../../apps/web/src/app-behavior.test.tsx).

### REQ-025

**El acceso admitirá username o correo y mantendrá compatibles las cuentas antiguas.**

- **Origen:** plan aprobado de acceso y biblioteca.
- **Aceptación:** registro con nombre visible, username separado, correo y contraseña. Username único sin distinguir mayúsculas, en minúsculas, 3–30 letras ASCII/números/puntos/guiones bajos, con validación cliente/servidor. Un campo de acceso elige endpoint de correo o username. Columna nullable para cuentas antiguas: entrada por correo y elección de username en Cuenta sin derivarlo del nombre. Errores localizados. Verificación y envío de restablecimiento dependen de SMTP/remitente; no se promete un flujo visible de recuperación inexistente.
- **Evidencia:** [Better Auth](../../apps/api/src/modules/auth/auth.ts), [formato](../../apps/api/src/modules/auth/auth.test.ts), [Cuenta](../../apps/web/src/features/account/Account.tsx), [migraciones](../../apps/api/prisma/migrations/) y [E2E](../../apps/web/e2e/journeys.spec.ts). Aplicar migración de username antes de ejecutar esta versión en cada entorno.

### REQ-026

**La biblioteca y ambos editores permitirán crear, cargar, actualizar, copiar y eliminar equipos con aislamiento de sesión.**

- **Origen:** plan aprobado de biblioteca y controles A/B.
- **Aceptación:** tabla de tres columnas: nombre, Pokémon localizados en orden y eliminar; conservar duplicados, omitir motes/arte y papelera accesible con nombre del equipo. Eliminar sin confirmación y quitar fila solo tras éxito. Selectores A/B por ID con resumen, copia completa solo al lado elegido y reinicio para repetir carga; limpiar errores/importación/exportación. Guardar equipo crea; Guardar cambios actualiza; Guardar copia crea y vincula.
- **Fiabilidad:** validar cada lado; serializar carga/mutaciones y bloquear solo controles privados mientras trabajan. Guardar captura sin sobrescribir ediciones posteriores; verificar asociaciones ownerId/teamId restauradas e ignorar respuestas de otra sesión. Error de biblioteca conserva sesión y permite Reintentar. Salir/cambiar cuenta/eliminar limpia asociaciones y mantiene contenido local. PUT 404 informa sin crear otro registro.
- **Evidencia:** [coordinación](../../apps/web/src/main.tsx), [editores](../../apps/web/src/features/teams/TeamEditor.tsx), [tabla](../../apps/web/src/features/account/PrivateLibrary.tsx), [regresiones](../../apps/web/src/app-behavior.test.tsx) y [E2E PostgreSQL](../../apps/web/e2e/journeys.spec.ts). No todos los casos de carrera tienen aserción independiente; se indican lagunas abajo.

### REQ-027

**Cuenta mostrará un carné de Entrenador y la biblioteca tendrá navegación propia.**

- **Origen:** plan de carné y peticiones posteriores de navegación.
- **Aceptación:** username, número real de equipos y alta localizada si es válida; contador con carga y omitido tras error. Sin correo, datos inventados ni retrato. Sin username, indicar ausencia y ofrecer formulario separado y espaciado; cierre de sesión en pie diferenciado. Biblioteca en /private-library, fuera de Cuenta/Team Builder. Cabecera deshabilitada sin sesión con ayuda accesible que explique la necesidad de cuenta; URL directa/enlace de Inicio muestran acceso a Cuenta. Cabecera con username y alternativa si falta. Ayuda dentro de ventana sin scroll vertical de cabecera.
- **Evidencia:** [Cuenta](../../apps/web/src/features/account/Account.tsx), [biblioteca](../../apps/web/src/features/account/PrivateLibrary.tsx), [cabecera](../../apps/web/src/main.tsx), [regresiones](../../apps/web/src/app-behavior.test.tsx) y [E2E temas](../../apps/web/e2e/theme.spec.ts).

### REQ-028

**Inicio presentará todas las herramientas y la marca Pokémon Tools con una Quick Ball existente.**

- **Origen:** plan de presentación y correcciones posteriores.
- **Aceptación:** un encabezado principal, introducción directa, acciones Crear equipo/Calcular daño y seis enlaces: tipos, Pokédex, creador, comparación, Daño y guardar equipos. Comparación navega a /team-builder#team-comparison, desplaza y enfoca sección. Marca enlaza a Inicio con arte existente de Quick Ball, sin logotipo generado ni fuente pixel; texto normal y títulos moderados, en ambos idiomas.
- **Evidencia:** [Inicio](../../apps/web/src/features/overview/Overview.tsx), [cabecera/foco](../../apps/web/src/main.tsx) y [E2E Inicio](../../apps/web/e2e/overview.spec.ts).

### REQ-029

**Mantener temas claro/oscuro y uso legible en móvil y con teclado.**

- **Origen:** planes aprobados de presentación, formularios y carné.
- **Aceptación:** tema del sistema hasta guardar elección; nombres accesibles, foco visible y ayudas con teclado. Comprobar 320 px, 390 px y escritorio en ambos temas/idiomas; ajustar textos largos, desplazar tablas dentro de su contenedor y evitar scroll vertical de cabecera. Separar ayudas/acciones; iconos decorativos sin nombres duplicados. No afirmar certificación WCAG ni compatibilidad probada con todos los navegadores.
- **Evidencia:** [tema](../../apps/web/src/lib/theme.test.tsx), [CSS](../../apps/web/src/style.css), [Cuenta/tema E2E](../../apps/web/e2e/theme.spec.ts), [Inicio E2E](../../apps/web/e2e/overview.spec.ts) y [comparación E2E](../../apps/web/e2e/team-comparison.spec.ts). Revisión visual/accesibilidad humana de la entrega pendiente.

## Verificaciones pendientes y aspectos no definidos

Estos puntos no se dan por satisfechos por la existencia de código ni añaden funciones nuevas al MVP.

| Área | Situación y evidencia que falta |
| --- | --- |
| GitHub y versión entregada | Conservar enlaces de Checks/CodeQL/Playwright y despliegues de la revisión entregada; confirmar reglas de ramas, chequeos obligatorios, Promotion source y aprobación de producción. |
| Host y recuperación | Revalidar cookies/cabeceras, suplantación, redes y separación; comprobar copia diaria, rechazo sin USB, restauración y rollback real. Esta revisión no vuelve a probar los éxitos comunicados anteriormente. |
| Casos recientes | Completar evidencia específica de edición durante guardado, fallo al eliminar, PUT 404 sin alta alternativa y transferencias sucesivas con todos los campos conservados. Las pruebas actuales de otros escenarios no se presentan como cobertura exhaustiva de estas combinaciones. |
| Rendimiento/disponibilidad | No hay objetivos aprobados y medidos de latencia, concurrencia, disponibilidad, RPO o RTO. No se inventan cifras ni garantías. |
| Cuotas/ciclo de vida | No hay cuota funcional definida de equipos por cuenta ni política documentada de retención/purga de caché y copias. Frescura de 24 horas no significa borrado automático. No se incluye interfaz de eliminación de cuenta. |
| Compatibilidad/accesibilidad | Pruebas de navegador/teclado/móvil no equivalen a certificación ni matriz exhaustiva entre navegadores. |
| Prioridad futura | No hay orden relativo de producto aprobado. Los requisitos activos pertenecen al MVP; jerarquizar iteraciones futuras requiere decisión nueva. |

## Fuera del alcance de esta entrega

- Simulador por turnos, generaciones anteriores como modos seleccionables y validación completa de torneos o repertorios por especie.
- Equipos profesionales/curados, progenitores Huevo inferidos y ampliación de repertorios al DLC de Escarlata/Púrpura.
- Google login, flujo visible de recuperación/borrado de cuenta y otras funciones ausentes del producto actual.
- SEO renderizado en servidor, rutas separadas por idioma y garantías de indexación.
- Kubernetes, Prisma 8, copia externa y objetivos operativos no acordados.

## Trazabilidad y mantenimiento

Los requisitos proceden de los planes/correcciones del propietario; esta revisión usa código, contratos, pruebas y configuración para describir su estado. La justificación técnica está en [arquitectura](../architecture/architecture.es.md) y ADR; la verificación, en [estrategia de pruebas](../testing/test-strategy.es.md) y [operaciones](../operations.es.md). Esos documentos conservan registros históricos: una descripción antigua de una pantalla no sustituye los criterios actuales de esta especificación y el código revisado. Esta actualización no modifica código ni entregables de presentación.
