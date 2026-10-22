[![English](https://img.shields.io/badge/lang-en-red.svg)](requirements.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](requirements.es.md)

# Requisitos de Pokémon Tools: primera versión

Esta especificación viva registra la arquitectura y el plan de producto de la novena generación de Escarlata/Púrpura aprobados por el propietario. Separa la **aprobación del requisito** del **progreso de implementación**. Todas las entradas del índice proceden del plan aprobado por el propietario; los ejemplos del curso o la implementación por sí solos no añaden requisitos.

El propietario aprobó el alcance de la primera versión sin asignar prioridades relativas, por lo que el campo de prioridad es **Sin decidir**. **Implementado** significa que existe código o configuración, pero aún no ha pasado toda la comprobación de aceptación. **Verificado** significa que la comprobación registrada tiene evidencia. **En curso** significa que falta parte del comportamiento solicitado o el entorno necesario. Verificar un comportamiento local no implica que el despliegue público haya superado sus comprobaciones de publicación.

| ID | Título | Tipo | Prioridad | Implementación |
| --- | --- | --- | --- | --- |
| [REQ-001](#req-001) | Alcance de la primera versión de la novena generación | Restricción | Sin decidir | Implementado |
| [REQ-002](#req-002) | Tabla de tipos | Funcional | Sin decidir | Verificado |
| [REQ-003](#req-003) | Estadísticas de Pokémon | Funcional | Sin decidir | Implementado |
| [REQ-004](#req-004) | Cálculo de daño | Funcional | Sin decidir | Implementado |
| [REQ-005](#req-005) | Creación y comparación de equipos de visitantes | Funcional | Sin decidir | Implementado |
| [REQ-006](#req-006) | Cuentas y equipos privados | Funcional | Sin decidir | Implementado |
| [REQ-007](#req-007) | Validación de conjuntos de combate | Funcional | Sin decidir | Implementado |
| [REQ-008](#req-008) | Equipos profesionales con atribución | Funcional | Sin decidir | Fuera de alcance |
| [REQ-009](#req-009) | Autoridad de datos de combate y descriptivos | Restricción | Sin decidir | Implementado |
| [REQ-010](#req-010) | Contratos y documentación de API | Restricción | Sin decidir | En curso |
| [REQ-011](#req-011) | Controles de seguridad de la aplicación | No funcional | Sin decidir | Implementado |
| [REQ-012](#req-012) | Entrada y confianza del proxy | Restricción | Sin decidir | En curso |
| [REQ-013](#req-013) | Stack del workspace y de ejecución | Restricción | Sin decidir | Implementado |
| [REQ-014](#req-014) | Comprobaciones automatizadas | No funcional | Sin decidir | En curso |
| [REQ-015](#req-015) | Promoción de imagen y reversión | Restricción | Sin decidir | En curso |
| [REQ-016](#req-016) | Copias de seguridad y comprobaciones de producción | No funcional | Sin decidir | En curso |
| [REQ-017](#req-017) | Recorridos de verificación | No funcional | Sin decidir | En curso |
| [REQ-018](#req-018) | Interfaz en inglés y español de España | Funcional | Sin decidir | Implementado |
| [REQ-019](#req-019) | Navegación de la Pokédex y datos de movimientos | Funcional | Sin decidir | Implementado |
| [REQ-020](#req-020) | Rutas directas de la Pokédex y SEO básico | Funcional | Sin decidir | Implementado |

## Detalle de requisitos

### REQ-001

La primera versión ofrecerá utilidades de Escarlata/Púrpura de la novena generación en inglés y español de España.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** la interfaz publicada y el catálogo de combate se limitan a este alcance, con inglés y `es-ES` como idiomas admitidos. Las generaciones anteriores y un simulador de combate entre jugadores no forman parte de los compromisos de la primera versión.
- **Evidencia actual:** la web y la API están implementadas en torno al catálogo de la novena generación y ofrecen presentación en inglés y español de España. El propietario informa de que la página de producción está disponible en `https://jcrserver.duckdns.org`; la aceptación de las funciones aún requiere revisión de producto.

### REQ-002

Los usuarios podrán consultar la efectividad defensiva de un Pokémon de la novena generación con uno o dos tipos, seleccionados directamente o mediante un buscador de Pokémon.

- **Origen:** plan de publicación de la novena generación aprobado por el propietario, ampliado por su petición explícita de tabla defensiva del 13-10-2026.
- **Aceptación:** la vista agrupa todos los tipos atacantes según el multiplicador combinado de los tipos defensivos elegidos. Planta/Tierra recibe 4× de daño de Hielo, 2× de Bicho, Fuego y Volador, 0,5× de Tierra y Roca, y 0× de Eléctrico. Al elegir una especie se rellenan sus tipos; la selección manual sigue limitada a dos.
- **Evidencia actual:** [pruebas del catálogo](../../apps/api/src/modules/catalog/catalog.test.ts), [prueba de interfaz](../../apps/web/src/type-chart.test.tsx) y [recorrido de visitantes](../../apps/web/e2e/journeys.spec.ts). La interfaz agrupa los resultados de la tabla de tipos fijada de la novena generación. La entrada pública es una comprobación independiente.

### REQ-003

Los usuarios podrán consultar las estadísticas base de Pokémon y los detalles descriptivos disponibles de la Pokédex.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** al seleccionar una especie conocida se muestran sus estadísticas de combate. Si los detalles descriptivos no están disponibles, las estadísticas siguen visibles.
- **Evidencia actual:** existen el [catálogo](../../apps/api/src/modules/catalog/catalog.ts), el [adaptador de PokéAPI](../../apps/api/src/modules/catalog/pokeapi-adapter.ts) y la vista web; todavía no se ha verificado el recorrido completo en navegador.

### REQ-004

Los usuarios podrán calcular el daño de un movimiento contra un objetivo y ver un intervalo en PS, otro en porcentaje y la probabilidad de debilitarlo de un golpe condicionada a que el movimiento acierte.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** las entradas válidas devuelven los resultados indicados y los nombres desconocidos del catálogo producen un error. La probabilidad no incluye la precisión del movimiento.
- **Evidencia actual:** las [pruebas de la calculadora](../../apps/api/src/modules/damage/damage.test.ts), la prueba de composición API y una vista previa local devolvieron resultados. Faltan comprobaciones más amplias de las condiciones de combate admitidas.

### REQ-005

Los visitantes podrán crear borradores y comparar dos equipos temporales de hasta seis Pokémon en su navegador.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** cada lado admite como máximo seis conjuntos; ambos borradores se conservan tras recargar el mismo navegador y la comparación refleja las ediciones.
- **Evidencia actual:** los borradores versionados conservan ediciones incompletas al recargar y, si falla el almacenamiento, se puede seguir editando. La auditoría local comprobó la migración y las posiciones fijas de movimientos. Al abrir un equipo guardado en la biblioteca privada, pasa al borrador del Equipo A y permanece al cerrar sesión. El recorrido Playwright local comprobó la recarga y los espacios de movimientos; las acciones de cuenta usaron una base PostgreSQL desechable aparte.

### REQ-006

Los usuarios podrán crear una cuenta de correo/contraseña, iniciar y cerrar sesión, y guardar, listar, volver a abrir y eliminar sus equipos privados.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** las solicitudes de equipo sin autenticar fallan y una cuenta autenticada no puede leer ni eliminar los equipos de otra. Los campos del conjunto guardado siguen disponibles al volver a abrirlo.
- **Evidencia actual:** están implementados Better Auth, las rutas de equipo, las operaciones Prisma limitadas al propietario y el borrado inmediato de la biblioteca en memoria al cerrar sesión. Testing Library comprueba que la biblioteca desaparece y que se ignora una respuesta retrasada de la sesión anterior. Un recorrido Playwright con PostgreSQL desechable verificó el registro, guardar/listar/volver a abrir/eliminar, el cierre de sesión y que la segunda cuenta recibía una lista vacía y un 404 al intentar borrar el equipo de la primera.

### REQ-007

La aplicación aceptará combinaciones de especies, movimientos, habilidades y objetos conocidos de la novena generación dentro de los rangos definidos, sin afirmar que sean legales en torneos.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** los nombres de catálogo desconocidos y los valores de nivel, EV, IV o modificadores fuera de rango no superan la validación. No se rechaza una combinación válida solo porque no sea legal en torneos.
- **Evidencia actual:** los [contratos Zod compartidos](../../packages/contracts/src/index.ts) y la [validación de nombres de catálogo](../../apps/api/src/modules/damage/smogon-adapter.ts) implementan estos límites; faltan las comprobaciones completas de validación.

### REQ-008

**Fuera del alcance actual:** se han retirado la pestaña de equipos profesionales, su ruta API, el contrato de respuesta y los registros seleccionados. Se conserva el requisito aprobado originalmente para mantener la trazabilidad; ya no forma parte del alcance de la versión actual.

### REQ-009

Los datos y las mecánicas de combate procederán de `@smogon/calc` fijado; los datos de PokéAPI guardados en caché aportarán únicamente información descriptiva.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** los fallos de PokéAPI no sustituyen los valores de la calculadora ni desactivan las utilidades de tipos, estadísticas o daño. Las formas admitidas tienen equivalencias explícitas; las formas sin equivalencia muestran datos descriptivos no disponibles en vez de sustituirse por otra forma.
- **Evidencia actual:** las pruebas del adaptador cubren el fallback de caché obsoleta, los datos descriptivos no disponibles, los fallos al leer/escribir la caché y la validación del host de sprites. Los datos de combate siguen procediendo de `@smogon/calc` fijado. No se han verificado la fuente en directo ni la integración con la base de datos.

### REQ-010

El navegador llamará a rutas `/api` del mismo origen mediante contratos Zod seguros para el navegador, con documentación OpenAPI generada e interfaz interactiva limitada a desarrollo y staging privado.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** las rutas publicadas tendrán descripciones precisas de solicitudes y respuestas; producción no expondrá la interfaz interactiva de documentación.
- **Evidencia actual:** los esquemas Zod compartidos describen las respuestas de las rutas propias y el navegador las valida en tiempo de ejecución. Las pruebas de inyección Fastify comprueban estados y metadatos de seguridad representativos. Las operaciones comodín de Better Auth están delegadas; siguen pendientes la comprobación exhaustiva del documento generado, las respuestas respaldadas por base de datos y la exposición de la documentación en producción.

### REQ-011

Las rutas de autenticación y API usarán controles de seguridad proporcionados, incluidas cookies HTTPS, validación de entradas, Helmet, limitación de solicitudes de Fastify con una versión corregida y límites de autenticación de Better Auth.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario, incluido el requisito de usar `@fastify/rate-limit` 11.2.0 o posterior.
- **Aceptación:** inspeccionar atributos de cookies y cabeceras de respuesta desplegadas; comprobar que se rechazan las entradas no válidas y el exceso de solicitudes según la configuración. El acceso a equipos privados seguirá limitado al propietario.
- **Evidencia actual:** crear/eliminar equipos rechaza `Origin` ausente, mal formado, `null` o no autorizado con 403 antes de consultar sesión/base de datos; pruebas utilitarias y de inyección Fastify cubren esta decisión. Un recorrido de navegador con PostgreSQL desechable verificó el aislamiento entre dos cuentas. Se depuran errores inesperados del cliente y URL de solicitud con tokens; las comprobaciones CSP locales incluyen los sprites de PokéAPI. Siguen pendientes las cookies/cabeceras HTTPS desplegadas y el comportamiento de `Origin` en cada ruta de entrada.

### REQ-012

Caddy compartido será el proxy inverso de la aplicación en staging privado y producción pública. Fastify y Better Auth solo confiarán en la información de reenvío que llegue por la ruta de proxy Caddy verificada, sin depender de una IP fija del contenedor.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario y decisión explícita sobre la confianza del proxy.
- **Aceptación:** probar DuckDNS directo con HTTPS cuando esté disponible, staging privado por Tailscale Serve y fallback público por Funnel. Las cabeceras de reenvío falsificadas no podrán alterar la dirección, host o protocolo de confianza; un par fuera del borde será rechazado; Fastify no publicará un puerto del host y las cookies de staging/producción estarán aisladas por hostname.
- **Evidencia actual:** el propietario informa de que staging Serve y la página pública DuckDNS de producción funcionan mediante Caddy. Esto verifica la accesibilidad básica, no las cabeceras falsificadas, el rechazo de pares ajenos al borde, las cabeceras de seguridad desplegadas ni el aislamiento de cookies; esas comprobaciones del host siguen pendientes.

### REQ-013

El proyecto usará un monorepo `pnpm` con el stack aprobado React/Vite, Fastify 5, Node 24, Zod 4, Better Auth, PostgreSQL 18 y Prisma 7. La imagen desplegable contendrá frontend y API, con configuración de ejecución específica por entorno.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** el workspace compila y la imagen de ejecución arranca con configuraciones y bases de datos separadas de staging/producción.
- **Evidencia actual:** el workspace local compila y existe el Dockerfile. El arranque de imagen y la separación de entornos esperan la validación con Docker.

### REQ-014

Las PR de funciones y los cambios en ramas de publicación ejecutarán comprobaciones automáticas de calidad; el repositorio tendrá configurados CodeQL y Dependabot.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** GitHub ejecutará las comprobaciones configuradas de compilación, tipos, lint, pruebas, esquema, navegador y análisis de código en los eventos previstos; Dependabot propondrá actualizaciones de dependencias.
- **Evidencia actual:** el propietario informa de que Checks y los workflows de despliegue en staging/producción finalizaron correctamente. Los workflows definen las comprobaciones y el despliegue para `staging` y `main`; conserva enlaces de ejecución de Actions como evidencia. Aún hay que confirmar directamente en GitHub la protección de ramas, la cobertura CodeQL y la configuración de revisores/ramas del entorno de producción.

### REQ-015

Un cambio en staging generará una imagen, la desplegará y probará mediante digest inmutable, y registrará el árbol Git y el digest verificados. Tras la aprobación, producción desplegará ese mismo digest; un fallo o una reversión solicitada recreará solo el servicio de aplicación anterior.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** para promover se necesita un árbol probado en staging; producción no recompila la imagen; la reversión recupera el digest anterior de la aplicación sin deshacer la base de datos. Las migraciones publicadas seguirán siendo compatibles con la imagen inmediatamente anterior.
- **Evidencia actual:** el propietario informa de que los workflows de staging y producción finalizaron y que la página de producción está disponible. El workflow de staging compila un digest y prueba algunas rutas; producción compara el árbol Git y promueve ese digest sin recompilar. No se han ejercitado la recuperación de un staging fallido ni la reversión exclusiva de la aplicación.

### REQ-016

PostgreSQL recibirá copias de seguridad diarias y anteriores a migraciones de producción, cifradas en el USB del mini PC. Producción exigirá una entrada pública funcional y una prueba de restauración desechable satisfactoria.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario, que eligió USB en vez de NAS.
- **Aceptación:** la copia se detiene si falta el montaje USB; una instantánea restaurada puede consultarse en una base desechable; la entrada pública funciona desde fuera de la red doméstica antes de habilitar producción.
- **Evidencia actual:** el propietario informa de que se completó una copia/comprobación y se ejecutó la restauración desechable de staging. También comunica que el despliegue de producción y la página pública funcionan, lo que implica que pasaron las comprobaciones del host. Estos datos no demuestran el comportamiento si falta el montaje ni una copia externa; el USB actual está en el mini PC.

### REQ-017

El comportamiento crítico de visitantes, cuentas, adaptadores de datos y entrada tendrá comprobaciones automatizadas o explícitas en el host.

- **Origen:** arquitectura y plan de publicación aprobados por el propietario.
- **Aceptación:** ejecutar Vitest, pruebas de integración de adaptadores, Testing Library y Playwright para los recorridos pertinentes; probar cabeceras falsificadas y límites de red en cada ruta de entrada. Registrar las lagunas que no puedan reproducirse en local.
- **Evidencia histórica (03-10-2026):** pasaron 24 pruebas API, 15 web y los cuatro recorridos Playwright, junto con lint, tipos, compilaciones de producción y comprobaciones estáticas de configuración. La vista previa de escritorio/móvil usó respuestas API simuladas. El recorrido de cuenta usó una base de datos desechable aislada; las comprobaciones de Docker/Compose y entrada del host seguían pendientes.
- **Evidencia actual (22-10-2026):** pasaron 49 pruebas API, 82 web, ESLint del repositorio, comprobaciones TypeScript, compilación de contratos, compilación de producción de Vite y auditoría de textos de interfaz. La prueba Playwright actual de Pokédex no pudo iniciarse porque falta Chromium; siguen pendientes la entrada del host y la revisión visual humana.

### REQ-018

La web ofrecerá textos de interfaz en inglés y español de España, etiquetas oficiales localizadas del catálogo Pokémon y un selector de idioma controlado por el usuario.

- **Origen:** plan de localización bilingüe aprobado por el propietario el 22-10-2026, con el requisito explícito de usar español de España y terminología oficial de Pokémon.
- **Aceptación:** el idioma inicial respeta una preferencia guardada o el idioma admitido del navegador y usa inglés como alternativa; un idioma español del navegador selecciona `es-ES`. Al cambiar, se actualizan los textos y metadatos sin perder formularios, borradores, Pokémon seleccionado, búsquedas, cuenta ni resultados. Las etiquetas usan PokéAPI idioma 7 y no `es-419` (idioma 14). Los identificadores canónicos de combate siguen siendo los valores enviados a la API.
- **Evidencia actual:** pruebas unitarias/de componentes y auditoría AST cubren idioma, persistencia/fallback, forma de diccionario, etiquetas del catálogo, entradas canónicas y conservación del estado. Sigue pendiente la revisión humana completa de las pantallas en ambos temas y tamaños de ventana.

### REQ-019

La Pokédex permitirá buscar en todo el catálogo y explorar progresivamente por número de la Pokédex Nacional, con datos oficiales de movimientos del juego base de Escarlata/Púrpura cuando estén disponibles para cada entrada apta.

- **Origen:** mejoras de Pokédex aprobadas por el propietario el 22-10-2026: orden nacional, carga de lista, grupos de aprendizaje, iconos de categoría y datos del juego base expresamente informativos.
- **Aceptación:** las entradas se ordenan por número nacional, forma base antes de formas alternativas y, después, nombre canónico. La búsqueda abarca todo el catálogo con nombres canónicos/localizados independientemente del límite visible. La interfaz añade entradas al llegar al final de la lista y ofrece un control accesible. Los movimientos de la entrada seleccionada se agrupan por método y muestran nombre localizado, iconos de tipo/categoría, nivel o número de máquina cuando la fuente los proporciona; los metadatos y repertorios ausentes se indican como no disponibles. Los repertorios especifican el juego base y no afirman progenitores de movimientos Huevo ni imponen legalidad de equipo.
- **Evidencia actual:** pruebas de componentes y API cubren orden nacional/de formas, búsqueda completa sin distinguir tildes, carga progresiva, grupos de movimientos, iconos, aprendizaje, números de máquina, datos no disponibles y grupo de versiones. La prueba Playwright actual de Pokédex no pudo iniciarse porque falta Chromium; sigue pendiente la revisión visual humana.

### REQ-020

Cada entrada apta de la Pokédex tendrá una URL directa estable y metadatos localizados básicos para su descubrimiento.

- **Origen:** plan de rutas directas y SEO básico aprobado por el propietario el 22-10-2026.
- **Aceptación:** un slug estable y sin colisiones abre la entrada correspondiente al navegar directamente o recargar, participa en el historial del navegador y normaliza su ruta. El título/descripción localizados, URL canónica, entrada en sitemap y reglas de indexación por entorno usan la URL base pública configurada. Un slug desconocido devuelve HTTP 404 y contenido de error localizado. No se garantiza el posicionamiento ni la indexación en buscadores.
- **Evidencia actual:** pruebas de rutas, metadatos, sitemap, robots y fallback estático cubren el contrato y nombres excepcionales. Playwright no pudo verificar la ruta directa porque falta Chromium; el origen canónico desplegado y la indexación externa siguen sin verificarse.

## Preguntas abiertas y alcance aplazado

Estos puntos **no** son requisitos aceptados de la primera versión hasta que el propietario los decida:

- ¿Un equipo guardado debe tener exactamente seis Pokémon o se puede guardar un borrador incompleto de hasta seis?
- ¿Es obligatoria la verificación de correo para la primera versión pública o basta el inicio de sesión por correo/contraseña si SMTP no está configurado?
- ¿Qué prioridades relativas deben asignarse a los requisitos aprobados de la primera versión?

El inicio de sesión con Google, las generaciones anteriores, un simulador de combates entre jugadores, el SEO renderizado en servidor, los espacios de URL separados por idioma, Kubernetes, una copia de seguridad remota y Prisma 8 siguen aplazados. Sentry, Husky, ElevenLabs y las herramientas locales de IA mencionadas durante la exploración no se han seleccionado como requisitos de la primera versión.

## Trazabilidad de fuentes y decisiones

Los requisitos proceden del plan aprobado por el propietario, no de ejemplos del curso. El método de redacción está informado por los documentos validados **Ingeniería del software → Análisis de requisitos → Tipologías de requisitos**, **Documentación y especificación de requisitos** y **Validación y verificación de requisitos**. Esas lecciones respaldan el uso de tipos claros, origen y criterios comprobables, pero no prescriben las funciones ni el stack del producto. La justificación de arquitectura corresponde a la visión de arquitectura y los ADR; las comprobaciones detalladas están en la estrategia de pruebas y la guía de operaciones.
