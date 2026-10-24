[![English](https://img.shields.io/badge/lang-en-red.svg)](api-contracts.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](api-contracts.es.md)

# Contratos de API y guía de OpenAPI

**Alcance:** rutas que Fastify registra actualmente para la versión bilingüe de la novena generación. **Estado (22-10-2026):** las rutas de funciones de la aplicación declaran esquemas de respuesta, resultados HTTP y seguridad relevante en el OpenAPI generado, con códigos de error estables y detalles de validación estructurados para localizar la interfaz. Better Auth sigue detrás de una ruta comodín y no dispone de esquemas operación por operación. Las comprobaciones locales de inyección han pasado; siguen pendientes las comprobaciones de OpenAPI respaldadas por base de datos y en despliegue. Consulta la [auditoría de código](code-audit-2026-10-03.es.md) y la [estrategia de pruebas](testing/test-strategy.es.md) para ver evidencia histórica y actual.

## Llamadas a la API

La web envía solicitudes del mismo origen a `/api` mediante su [cliente de peticiones](../apps/web/src/lib/api.ts), usando JSON y credenciales del navegador. En local, Vite las redirige a Fastify; la imagen desplegada sirve la web y la API desde el mismo origen, detrás de Caddy. La API pública no tiene versión. Las rutas implementadas se registran en [app.ts](../apps/api/src/app.ts); este documento debe actualizarse cuando cambien las rutas o sus contratos.

El navegador no necesita una clave de API para las utilidades públicas. Las rutas de equipos privados requieren una cookie de sesión de Better Auth. El servidor comprueba la sesión y limita las operaciones de base de datos al ID de usuario correspondiente. Crear, actualizar y eliminar equipos también requiere un `Origin` de confianza exacto; los valores ausentes, mal formados, `null` o no autorizados reciben 403. Los equipos de comparación de visitantes permanecen en el navegador y no tienen rutas de API. El [plan de seguridad](security/security-plan.es.md) describe las cookies, los límites de solicitudes, la identidad del proxy y el control `Origin` seleccionado.

| Método y ruta | Acceso | Solicitud | Resultado y estados relevantes |
| --- | --- | --- | --- |
| `GET /api/health` | Público | Ninguna | `200` con `{ "status": "ok" }`; se usa para comprobar el estado del servicio. |
| `GET /api/catalog` | Público | Ninguna | `200` con `species` de la novena generación (nombre canónico, tipos, estadísticas base, elegibilidad opcional, número de la Pokédex Nacional, slug estable y marca de forma base), `moves`, `abilities`, `items`, `types`, `natures` y mapas opcionales `translations` con nombres oficiales para mostrar en inglés y español de España. Los valores de combate proceden de datos fijados de la calculadora. |
| `GET /api/type-chart` | Público | Ninguna | Array `200` de filas `{ attack, against }`; `against` relaciona nombres de tipos defensivos con multiplicadores. |
| `GET /api/pokedex/:species` | Público | Nombre canónico de especie en la ruta | `200` con datos descriptivos de PokéAPI, número nacional, slug estable, candidatos de ilustración normal/variocolor y masculino/femenino, habilidades con estado oculto y descripciones bilingües/grupo de origen opcionales, campos en caché o un objeto `unavailable`; `400` si la especie no pertenece al conjunto oficial de la Pokédex. El campo heredado `sprite` sigue siendo el primer candidato normal para clientes existentes. |
| `GET /api/pokedex/:species/evolution` | Público | Nombre de especie en la ruta | `200` con nodos de familia, transiciones con grupos alternativos de requisitos y enlaces Mega por separado; si falla la consulta, devuelve `unavailable`; `400` si la especie no pertenece al conjunto oficial de la Pokédex. |
| `GET /api/pokedex/:species/moves` | Público | Nombre de especie en la ruta | `200` con los movimientos registrados del juego base de Escarlata/Púrpura, revisión/grupo de versiones de origen, nombres localizados, tipo/categoría anulables, métodos de aprendizaje, niveles y números de MT disponibles; indica expresamente cuándo faltan datos de aprendizaje; `400` para una especie no admitida. |
| `GET /api/site-config` | Público | Ninguna | `200` con la URL base pública y el entorno de despliegue; se usan para metadatos canónicos y reglas de indexación. |
| `POST /api/damage` | Público | JSON de [solicitud de daño](../packages/contracts/src/index.ts) | `200` con intervalo de daño, probabilidad condicional de debilitamiento en un golpe y datos estructurados del enfrentamiento canónico/ausencia de efecto; `400` si la estructura no es válida o si hay nombres desconocidos. |
| `GET /api/me/teams` | Sesión | Ninguna | `200` con los equipos guardados del usuario, ordenados por última actualización; `401` sin sesión. |
| `POST /api/me/teams` | Sesión y `Origin` de confianza | JSON de [entrada de equipo](../packages/contracts/src/index.ts) | `201` con el equipo creado y asociado a su propietario; `400` para una estructura o nombres no válidos; `401` sin sesión; `403` si falta un `Origin` autorizado. |
| `PUT /api/me/teams/:id` | Sesión y `Origin` de confianza | ID del equipo en la ruta y JSON de [entrada de equipo](../packages/contracts/src/index.ts) | `200` con el equipo actualizado y asociado a su propietario; `400` para una estructura o nombres no válidos; `401` sin sesión; `403` si falta un `Origin` autorizado; `404` si el usuario no tiene un equipo con ese ID. |
| `DELETE /api/me/teams/:id` | Sesión y `Origin` de confianza | ID del equipo en la ruta | `204` sin cuerpo al eliminar; `401` sin sesión; `403` si falta un `Origin` autorizado; `404` si el usuario no tiene un equipo con ese ID. |
| `GET` o `POST /api/auth/*` | Depende de la operación de Better Auth | Delegada a Better Auth | La interfaz usa `GET /api/auth/get-session` y `POST` para registrarse con correo, iniciar sesión con nombre de usuario o correo, reclamar un nombre de usuario y cerrar sesión. El registro exige un nombre de usuario único normalizado a minúsculas (3–30 caracteres ASCII: letras, números, guiones bajos o puntos); las cuentas existentes pueden elegir uno en Cuenta. La ruta comodín de OpenAPI de la aplicación no describe las cargas, respuestas, cookies ni otras operaciones exactas de autenticación. |

En desarrollo y staging privado, `GET /api/ingress-debug` expone el par remoto, la IP efectiva del cliente, el protocolo, el host y algunas cabeceras de reenvío para comprobar el proxy. No está disponible con `DEPLOY_ENV=production`; es un diagnóstico operativo, no una API de producto. La interfaz OpenAPI interactiva está en `/docs` en desarrollo y staging, con el JSON en `/docs/json`; no se registra en producción. Aun así, hay que probar las rutas desplegadas, porque la configuración y los documentos generados por sí solos no demuestran su exposición ni su comportamiento.

El servidor también sirve `/sitemap.xml` y `/robots.txt` fuera del prefijo `/api`. El sitemap de producción enumera las rutas públicas y los slugs aptos de la Pokédex; producción permite el rastreo fuera de `/api/`. Desarrollo y staging impiden la indexación. El fallback SPA sirve `index.html` para rutas válidas de páginas y entradas `/pokedex/:slug`; los slugs de Pokédex con sintaxis válida pero desconocidos devuelven HTTP 404 junto con la aplicación localizada. Las rutas principales del navegador son `/`, `/type-chart`, `/pokedex`, `/pokedex/:slug`, `/team-builder`, `/damage` y `/account`.

## Formas de las solicitudes compartidas

El [paquete de contratos](../packages/contracts/src/index.ts), seguro para el navegador, exporta esquemas Zod y tipos TypeScript inferidos. Fija la primera versión a la generación 9 e incluye esquemas distintos para borradores locales permisivos, equipos enviados con validación estricta y cuerpos de respuesta propios de la aplicación. `app.ts` convierte los esquemas de solicitud y respuesta a JSON Schema para OpenAPI; el navegador analiza las respuestas de funciones en tiempo de ejecución. Las operaciones delegadas de Better Auth están fuera del registro de respuestas de la aplicación.

**Nombres canónicos y traducciones.** `/api/catalog` proporciona identificadores canónicos en inglés y mapas opcionales de nombres para mostrar en inglés y español de España; la API no negocia el idioma de la respuesta. La web elige el idioma y envía nombres canónicos. Los [ayudantes de etiquetas](../apps/web/src/lib/catalog-labels.ts) y el [campo de entrada del catálogo](../apps/web/src/components/catalog-input.tsx) traducen los nombres mostrados y conservan los valores canónicos reconocidos en borradores y solicitudes. Las traducciones usan datos oficiales generados de PokéAPI (el idioma 7 es español de España; se excluye el 14), con equivalencias con fuentes documentadas y excepciones explícitas. La validación admite las grafías normalizadas que tiene soportadas y la persistencia guarda los nombres enviados sin reescribirlos; los clientes externos deben usar nombres canónicos. Si colisionan varias sugerencias traducidas, se añade entre paréntesis su nombre canónico. Las ediciones incompletas del navegador permanecen localmente y se someten a la validación habitual al enviarse. La [guía de la web](website-guide.es.md#recursos-de-traducción-y-valores-canónicos) describe la selección de idioma y la presentación de etiquetas.

**Conjunto Pokémon.** `species` es obligatorio. Un conjunto puede incluir apodo, objeto, habilidad, naturaleza, nivel, hasta cuatro movimientos, EV, IV, modificadores, tipo Teracristal y estado. Los valores predeterminados son nivel 50, naturaleza Seria, cero EV/modificadores y 31 IV. Cada EV va de 0 a 252 y el total no supera 510; el nivel va de 1 a 100. El [adaptador de daño](../apps/api/src/modules/damage/smogon-adapter.ts) comprueba los nombres conocidos en los datos de la calculadora de la novena generación. Esto valida nombres y rangos, no la legalidad del equipo en torneos. Se aceptan nombres opcionales vacíos de objeto y habilidad.

**Solicitud de daño.** Envía `attacker`, `defender`, `move` y, opcionalmente, `field` con Combates Individuales/Dobles, clima, terreno, pantallas, trampas, golpe crítico, Refuerzo, Compiescolta y opciones de Teracristalización. Los valores de campo omitidos se interpretan como condiciones neutras. Si una opción de Teracristalización está activada, el conjunto debe tener un tipo Teracristal. Ejemplo mínimo válido:

```json
{
  "attacker": { "species": "Pikachu" },
  "defender": { "species": "Charizard" },
  "move": "Thunderbolt",
  "field": {}
}
```

El resultado correcto incluye `generation`, `min`, `max`, `minPercent`, `maxPercent`, `koChanceOnHit`, `defenderHp` y el campo compatible `description`. El adaptador también devuelve `matchup: { attacker, defender, move }` con nombres canónicos en inglés y `hasEffect`, que vale `true` cuando el daño máximo es mayor que cero. Estos campos añadidos son opcionales en `damageResponseSchema` para mantener la compatibilidad con respuestas anteriores. El navegador construye un resumen estructurado localizado a partir del enfrentamiento y los datos de daño, y omite la narración inglesa del motor. La API sigue devolviendo `description` por compatibilidad; los clientes no deben considerarla un texto localizado.

`koChanceOnHit` es una probabilidad entre 0 y 1 **condicionada a que el movimiento acierte**; no incluye la precisión. Los porcentajes se calculan respecto a los PS del defensor. El esquema de respuesta compartido se registra en OpenAPI y lo comprueba el cliente API del navegador.

**Entrada de equipo guardado.** Envía un `name` no vacío y un array `pokemon` de hasta seis conjuntos; `notes` pasa a ser una cadena vacía y `format`, `gen9` si se omiten. El esquema compartido permite actualmente cero integrantes. Ejemplo mínimo:

```json
{
  "name": "Practice team",
  "pokemon": [{ "species": "Pikachu", "moves": ["Thunderbolt"] }]
}
```

El adaptador de persistencia guarda los conjuntos analizados y devuelve los registros de equipo al crear, listar y actualizar. `PUT` solo actualiza una fila cuyo ID y propietario coinciden con la sesión; un ID inexistente o ajeno devuelve el mismo `404 team-not-found`. El navegador mantiene independientes los borradores cargados y envía instantáneas al guardar cambios o una copia. Los [requisitos](requirements/requirements.es.md#req-006) dejan abierta la política exacta sobre el tamaño de equipo guardado; este documento refleja el comportamiento actual y no establece una regla nueva.

## Respuestas y límites de error

Las rutas usan `200`, `201`, `204`, `400`, `401`, `403` y `404` en los casos indicados. La comprobación de par remoto puede responder `403`; si falta la configuración de entrada fuera de desarrollo, puede responder `503`. Fastify limita las solicitudes generales a 120 por minuto y Better Auth tiene un límite propio de 100 cada 60 segundos; el exceso puede producir `429`. Son valores de configuración actuales, no una garantía pública de capacidad. Fastify también puede rechazar JSON mal formado o infracciones de esquema antes de ejecutar el manejador. Se conservan los estados 4xx del framework con mensajes controlados y los fallos inesperados del servidor devuelven un cuerpo 500 genérico depurado. Better Auth mantiene su propia semántica de respuesta; no todos los resultados de infraestructura se describen como respuestas de las rutas de la aplicación, así que los clientes deben comprobar primero el estado HTTP.

Los cuerpos de error de la aplicación usan `apiErrorResponseSchema`: texto o detalles de compatibilidad `error` obligatorios, un `code` estable obligatorio e `issues` opcional. Los códigos cubren errores de autenticación, origen y propiedad; nombres desconocidos del catálogo; validación de solicitudes; errores de entrada y estados HTTP/servidor controlados. Cada incidencia lleva su propio `code` y una ruta `path` con nombres de campos/índices de array, más `value`, `rule`, `minimum`, `maximum` o `expected` opcionales. Ejemplo:

```json
{
  "error": "Unknown move: Invalid move",
  "code": "validation-failed",
  "issues": [{ "code": "unknown-move", "path": ["move"], "value": "Invalid move" }]
}
```

El [archivo de recursos de errores](../apps/api/src/resources/errors.ts) centraliza mensajes de compatibilidad en inglés. Los clientes deben utilizar `code` y los metadatos estructurados de las incidencias en vez de traducir o analizar `error`. El [formateador de errores](../apps/web/src/lib/errors.ts) relaciona los códigos y los campos/reglas de validación con los [mensajes de idioma](../apps/web/src/locales/en.ts); los errores locales de Zod usan el mismo mecanismo. También traduce códigos conocidos de Better Auth y aplica respuestas alternativas controladas por estado a los fallos desconocidos en vez de mostrar texto arbitrario. Los errores de red y las respuestas correctas con una estructura no válida tienen mensajes localizados. Los códigos de error no cambian los estados HTTP ni relajan la validación de API.

El [adaptador de PokéAPI](../apps/api/src/modules/catalog/pokeapi-adapter.ts) puede devolver campos descriptivos en caché o `{ "source": "PokéAPI", "unavailable": true }`, a veces con un motivo. Una respuesta de detalle puede incluir `pokedexId`, `pokedexSlug`, `familyKey`, habilidades (`name`, `isHidden` y `descriptions` bilingües opcionales con el grupo de versiones de origen) y candidatos de ilustración normales/variocolor. Si falta una variante variocolor o de género, no se sustituye por otra. `sprite` se conserva como primer candidato normal por compatibilidad. Los datos de evolución se solicitan aparte y devuelven `nodes`, `edges` (`alternatives` usa OR entre métodos y AND dentro de cada método) y `megaForms`. Los detalles y la evolución usan claves versionadas en la caché JSON de 24 horas y sirven datos válidos obsoletos si falla la fuente. Los textos de habilidades y los catálogos de traducción proceden de instantáneas generadas e incluidas en el repositorio. Los consumidores deben aceptar que falten datos descriptivos y mantener disponibles las herramientas de combate. La [política de fuentes de catálogo](data-sources.es.md) define la autoridad de los datos de combate y los descriptivos, así como los datos de traducción y aprendizaje generados.

## Cobertura y publicación de OpenAPI

`@fastify/swagger` construye un documento OpenAPI a partir de los esquemas de rutas Fastify registradas. Las rutas de funciones de la aplicación declaran actualmente esquemas de éxito/error y códigos de estado. Las rutas de listar/crear/eliminar equipos declaran seguridad por cookie; POST/DELETE describen la respuesta 403 para `Origin` no autorizado y DELETE documenta el parámetro `id` y el 204 sin cuerpo. Las [pruebas de composición de la API](../apps/api/src/app.test.ts) comprueban respuestas, estados y seguridad representativos del documento generado. La ruta comodín de Better Auth sigue delegada, no expandida en operaciones individuales.

El trabajo contractual pendiente de [REQ-010](requirements/requirements.es.md#req-010) es concreto:

1. Ampliar las comprobaciones de OpenAPI generado a todas las rutas propias y comparar estados/cuerpos respaldados por la base de datos, incluidos datos inválidos, sesiones ausentes, IDs de otro propietario y fallback de PokéAPI.
2. Decidir si conviene definir un contrato con versión propia para las operaciones admitidas por Better Auth; las rutas comodín no tienen aquí descripciones operación por operación.
3. Verificar `/docs` y `/docs/json` en staging privado, y confirmar que no están disponibles desde producción pública. Comprobar por HTTPS el comportamiento documentado de cookies y límites de solicitudes.

Son lagunas de documentación y verificación, no una afirmación de que los manejadores actuales rechacen todas las solicitudes válidas. No existe un `openapi.yaml` independiente incluido en el repositorio; el documento generado es la fuente actual de metadatos OpenAPI publicados. Los cambios de comportamiento de ruta y de su esquema OpenAPI deben revisarse conjuntamente para evitar divergencias.

## Influencia del curso y decisiones del proyecto

La lección validada del material privado **Calidad → Documentación con IA → APIs y componentes** pide incluir métodos, autenticación, ejemplos de solicitudes y respuestas, errores y límites, y distingue un archivo OpenAPI generado de la prueba de que coincide con el comportamiento. **Fundamentos del desarrollo de software → Fundamentos de sistemas y redes → APIs y comunicación** respalda interpretar método, estado, cabeceras y JSON como un único contrato de solicitud/respuesta. Estos principios orientan la revisión. Las rutas, los esquemas Zod, la autenticación y el alcance son decisiones de implementación de Pokémon Tools aprobadas por el propietario; no se reproduce material privado del curso.
