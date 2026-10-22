[![English](https://img.shields.io/badge/lang-en-red.svg)](operations.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](operations.es.md)

# Operaciones del mini PC y puertas de publicación

Esta es una guía para preparar el mini PC. Los archivos de este repositorio no crean por sí solos recursos de GitHub, DuckDNS, Tailscale, router, USB o SSH. Guarda todos los secretos en archivos del servidor propiedad de root y en secretos cifrados de GitHub; no los subas al repositorio.

## Estado actual del host y de la publicación (2026-09-30)

El mini PC ejecuta Ubuntu 24.04.4, Docker Compose 5.1.1 y Tailscale 1.102.4. El repositorio revisado está en `/opt/pokemon-tools`; se instalaron los scripts del host propiedad de root y el directorio de estado `/var/lib/pokemon-deploy`. Existen las redes de borde externas de staging y producción. La persona propietaria informa de ejecuciones satisfactorias de ambos flujos y de que la página de producción está activa en `https://jcrserver.duckdns.org`.

Caddy compartido se ejecuta con UID/GID `1003:1003`. Sus listeners públicos son los puertos 80 y 443 del host; los listeners de traspaso de Tailscale están limitados al loopback en `127.0.0.1:18081` (staging) y `127.0.0.1:18082` (Funnel de producción opcional). Las API de staging y producción se han desplegado mediante sus flujos y usan servicios PostgreSQL separados. Caddy debe seguir conectado a `pokemon_ingress`, `pokemon_stage_edge` y `pokemon_prod_edge` para que los nombres de servicio se resuelvan tras recrear una API.

El montaje USB y el repositorio restic cifrado están configurados. La copia y `restic check` terminaron correctamente, y la persona propietaria ejecutó la prueba de restauración de staging; el script restauró la instantánea en una base de datos desechable y terminó sin errores comunicados. El repositorio sigue conectado al mini PC, por lo que es recuperación local, no una copia fuera del host.

El host Tailscale tiene la etiqueta `tag:pokemon-host`. El servicio `svc:pokemon-staging` está configurado para `tcp:443`, y su proxy HTTPS Serve apunta a `http://127.0.0.1:18081`. La política de tailnet cambió de la regla inicial que permitía todo a permisos para administradores y `tag:ci`, con acceso SSH al host y acceso TCP 443 al servicio de staging; la persona propietaria informó de que la política revisada seguía funcionando. El flujo de staging prueba la aplicación por su URL privada. La ruta pública de producción usa DuckDNS HTTPS a través de Caddy; la persona propietaria informa de que la página funciona después del despliegue.

Tailscale Funnel es opcional y no consta que esté habilitado. Como Serve privado de staging usa HTTPS en el puerto 443 de este nodo, una alternativa Funnel usaría el puerto 8443 y exigiría comprobar DNS y URL base. La ruta de despliegue de la aplicación y la página pública funcionan según el informe; siguen pendientes las pruebas completas de suplantación de cabeceras del proxy, revisión de cookies y seguridad, recorridos de cuenta, ajustes efectivos de protección de flujos y entornos, y ejercicio de reversión.

## 1. Preparación del host

Instala Docker Engine con el plugin actual de Compose (`docker compose`), Tailscale, restic, el servidor OpenSSH, curl y una unidad USB montada en el mini PC. Coloca una copia del repositorio revisada por administración en `/opt/pokemon-tools`. Controla esa copia y los scripts instalados como administración, porque el despliegue privilegiado lee sus definiciones Compose y carga sus archivos de entorno. Conserva los finales de línea LF en scripts shell y archivos de entorno.

Desde esa copia revisada del host, instala comandos ejecutables propiedad de root y crea el directorio privado de estado de publicación:

```sh
cd /opt/pokemon-tools
sudo install -o root -g root -m 0755 infra/scripts/deploy.sh /usr/local/sbin/pokemon-deploy
sudo install -o root -g root -m 0755 infra/scripts/deploy-ssh.sh /usr/local/sbin/pokemon-deploy-ssh
sudo install -o root -g root -m 0755 infra/scripts/backup.sh /usr/local/sbin/pokemon-backup
sudo install -o root -g root -m 0755 infra/scripts/restore-drill.sh /usr/local/sbin/pokemon-restore-drill
sudo install -d -o root -g root -m 0700 /var/lib/pokemon-deploy
```

`install` copia cada script, le da permiso de ejecución y establece su propietario; no despliega la aplicación ni ejecuta una copia de seguridad. Reinstala estos archivos deliberadamente cuando cambie el código de infraestructura: la promoción de una imagen de aplicación no actualiza los scripts del host. El despliegue de producción invoca el `/usr/local/sbin/pokemon-backup` instalado antes de las migraciones cuando ya existe el contenedor de base de datos. La propiedad de los scripts del host es independiente del UID/GID del contenedor Caddy, que se configura más abajo.

Crea las dos redes de borde externas antes de iniciar Compose:

```sh
docker network create --subnet 172.31.11.0/24 --gateway 172.31.11.1 pokemon_stage_edge
docker network create --subnet 172.31.12.0/24 --gateway 172.31.12.1 pokemon_prod_edge
```

Reserva estas subredes para este conjunto y comprueba que no entren en conflicto con rutas Docker, LAN o tailnet existentes. Solo Caddy y el servicio API correspondiente pueden unirse a cada red de borde. Las redes de bases de datos son privadas de Compose. La API no publica un puerto del host.

Copia [`infra/secrets/staging.env.example`](../infra/secrets/staging.env.example) y [`production.env.example`](../infra/secrets/production.env.example) a `/opt/pokemon-tools/infra/secrets/staging.env` y `production.env`, propiedad de root y con permisos `0600`. Sustituye todos los marcadores antes de usar los archivos y conserva los que ya estén configurados al repetir la preparación. Ambos necesitan `DB_PASSWORD`, un `DATABASE_URL` con codificación URL para la base correspondiente y un `BETTER_AUTH_SECRET` distinto de al menos 32 caracteres. Staging también necesita `STAGING_BASE_URL=https://pokemon-staging.<tailnet>.ts.net` y `STAGING_HOST=pokemon-staging.<tailnet>.ts.net`. Producción necesita `PUBLIC_HOST=<DuckDNS-host>`, `FUNNEL_BASE_URL=https://<mini-pc>.<tailnet>.ts.net:8443` y `PUBLIC_BASE_URL` con la dirección pública principal que funciona: DuckDNS cuando hay entrada directa; si no, Funnel. `SMTP_URL` y `EMAIL_FROM` son opcionales y habilitan la verificación de correo y el restablecimiento de contraseña. Define `DB_PASSWORD` con la contraseña exacta de la base de datos y codifica con porcentaje los caracteres reservados de `DATABASE_URL`. El script de despliegue carga estos archivos como Bash, así que usa asignaciones literales `KEY='valor'`, sin referencias a otras variables. Elige las contraseñas antes de inicializar los volúmenes.

Copia [`infra/secrets/caddy.env.example`](../infra/secrets/caddy.env.example) como `caddy.env`, propiedad de root y con permisos `0600`. Configura `CADDY_UID=1003` y `CADDY_GID=1003` para que coincidan con la cuenta `utilities` del mini PC y completa `PUBLIC_HOST`, `STAGING_HOST`, `FUNNEL_HOST`, `ACME_EMAIL` y `TAILSCALE_PROXY_PEER`. El último valor debe ser la dirección exacta de la pasarela Docker del host que Caddy observa para peticiones de Tailscale publicadas en loopback, normalmente `172.31.10.1`; no uses toda una subred privada como par de confianza. Pruébalo en el host Docker real antes de publicar.

Compose ejecuta el proceso Caddy con el UID/GID configurado. Docker en el mini PC usa el daemon del sistema; pertenecer al grupo Docker de la cuenta `utilities` permite utilizar la CLI. El archivo de entorno sigue siendo propiedad de root: Compose lo lee y pasa sus valores a Caddy. Haz que UID 1003 pueda leer `infra/caddy/Caddyfile`, por ejemplo, con propiedad root y permisos `0644`, y que los directorios superiores permitan recorrer la ruta. El montaje es de solo lectura y no crea un directorio si falta el archivo de origen ([referencia de montajes Compose](https://docs.docker.com/reference/compose-file/services/#volumes)).

La imagen oficial actual de Caddy permite que un proceso no root escriba en `/data/caddy` y `/config/caddy` y enlace puertos HTTP/HTTPS ([Dockerfile de la imagen](https://github.com/caddyserver/caddy-docker/blob/fba2853501d36e8a72f946ac8cb7ff64d07e48f2/2.11/alpine/Dockerfile)). Los volúmenes con nombre nuevos heredan el contenido de la imagen, así que el primer inicio no debería necesitar cambios manuales de propietario. Los volúmenes usados antes por Caddy como root quizá necesiten ajustar la propiedad de los datos Caddy afectados mientras el servicio está parado; conserva los certificados y no cambies la propiedad del directorio de almacenamiento de Docker. Inicia Caddy compartido desde `/opt/pokemon-tools`:

```sh
sudo docker compose --env-file infra/secrets/caddy.env -f infra/compose/caddy.yaml up -d
```

Para preparar el host antes de que CI de staging compile la primera imagen de aplicación, inicia solo las bases de datos. Compose también interpola la variable de imagen API obligatoria; estos comandos proporcionan un marcador temporal para analizar la configuración ([referencia de interpolación de Docker](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)):

```sh
sudo env IMAGE_DIGEST=pokemon-tools-bootstrap:db-only docker compose --env-file infra/secrets/staging.env -f infra/compose/staging.yaml up -d db
sudo env IMAGE_DIGEST=pokemon-tools-bootstrap:db-only docker compose --env-file infra/secrets/production.env -f infra/compose/production.yaml up -d db
```

El servicio `db` seleccionado no depende de la API, así que estos comandos solo inician PostgreSQL. No guardes el marcador en los archivos de entorno y úsalo solo con `up -d db`. El despliegue completo usa un digest GHCR real exportado por `pokemon-deploy`. Caddy puede ejecutarse ya, pero las rutas de aplicación fallarán hasta desplegar sus contenedores API.

El hostname DuckDNS ya resuelve y Caddy ha obtenido un certificado válido. Una petición del navegador desde fuera de la LAN del host llegó a Caddy mediante HTTPS y devolvió 502 cuando el contenedor API de producción aún no existía. Por tanto, la entrada directa DNS/TLS responde, pero no se verificó la salud de la aplicación de producción. Mantén el reenvío del router para 80/443 dirigido al mini PC para que Caddy renueve el certificado y sirva la ruta pública. Si falla la entrada directa, utiliza la alternativa Tailscale Funnel descrita más abajo y mantén Caddy como proxy de entrada en ambos casos.

## 2. Rutas de tailnet y validación del proxy

### Staging privado con Tailscale Serve

Define `tag:pokemon-host` en la sección `tagOwners` de la política tailnet y asígnala al mini PC. Por ejemplo:

```json
"tagOwners": {
  "tag:pokemon-host": ["autogroup:admin"],
},
```

Al asignar una etiqueta, el dispositivo pasa a una identidad basada en esa etiqueta. Define el servicio Tailscale `pokemon-staging` en la consola de administración con endpoint `tcp:443`; aprueba el mini PC como host del servicio si no existe una regla de aprobación automática. Activa Tailscale Serve/HTTPS cuando se solicite y configura su endpoint HTTPS para que apunte al traspaso de staging de Caddy:

```sh
sudo tailscale serve --service=svc:pokemon-staging --https=443 http://127.0.0.1:18081
sudo tailscale serve status --json
```

El servicio staging es privado para dispositivos tailnet permitidos por la política activa. Pruébalo desde un segundo dispositivo autorizado con Tailscale instalado y conectado. La política restringida actual debe conceder a los dispositivos previstos acceso a `svc:pokemon-staging` por el puerto 443.

### Alternativa pública de producción con Tailscale Funnel

Tailscale Serve y Funnel no pueden usar el mismo puerto en el mismo nodo. Como Serve de staging ocupa HTTPS 443, configura Funnel de producción en HTTPS 8443. Funnel es público; no lo uses para staging privado. En el entorno de producción define `FUNNEL_BASE_URL=https://<mini-pc>.<tailnet>.ts.net:8443`. `FUNNEL_HOST` debe ser solo `<mini-pc>.<tailnet>.ts.net`, sin esquema, ruta ni puerto, porque Caddy lo usa como host upstream. Si la entrada DuckDNS directa es la URL principal de producción, mantenla en `PUBLIC_BASE_URL`.

El cliente Tailscale instalado puede proporcionar un enlace de consentimiento para habilitar Funnel y actualizar la política tailnet. Después configura el traspaso de producción:

```sh
sudo tailscale funnel --bg --https=8443 http://127.0.0.1:18082
sudo tailscale funnel status
```

La URL de la alternativa pública incluye `:8443`. Antes de operar en otro host, verifica la sintaxis CLI con la versión instalada de Tailscale. Los listeners de Tailscale de Caddy solo se publican en loopback del host. Caddy acepta la IP de cliente reenviada solo desde el par local de proxy verificado en esos listeners, sobrescribe `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Host` y `X-Forwarded-Proto` antes de enviar a Fastify y elimina las cabeceras de identidad Tailscale que no utiliza. El listener público directo sobrescribe las mismas cabeceras a partir de su par directo. Fastify comprueba el **par del socket sin procesar** antes de la autenticación y solo confía en datos de proxy dentro del CIDR de borde del entorno. Better Auth solo lee el `X-Real-IP` depurado por Caddy y tiene orígenes explícitos.

La persona propietaria sustituyó la autorización inicial que permitía todo por reglas restringidas para administradores y `tag:ci`, con acceso SSH al host de despliegue y TCP 443 a `svc:pokemon-staging`. Vuelve a comprobar la política activa en la consola de administración de Tailscale cuando cambien las etiquetas, los hosts o los servicios.

Antes de habilitar producción, prueba las tres rutas del navegador con valores normales y suplantados de `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Host` y `X-Forwarded-Proto`. En staging privado, `/api/ingress-debug` informa del par sin procesar de Fastify, la IP efectiva del cliente, el esquema y el host. Comprueba que, pese a la suplantación, la IP siga siendo la del cliente remoto real y que el esquema sea HTTPS. Usa un contenedor temporal conectado solo a una red no periférica para confirmar que una petición directa a la API recibe 403; verifica que `docker ps` no muestre un puerto de Fastify publicado en el host. Comprueba los almacenes de cookies separados de staging y producción/Funnel. La ruta de depuración está deshabilitada en producción. Inspecciona los registros de Caddy y Fastify durante las pruebas de producción. Si Docker reenvía peticiones publicadas en loopback con un par distinto de `TAILSCALE_PROXY_PEER`, corrige el valor exacto y repite las pruebas; no debilites la protección para aceptar rangos privados arbitrarios.

## 3. GitHub y promoción

El repositorio y los flujos de despliegue de GitHub están en uso. Desarrollo ejecuta Checks y CodeQL, pero no tiene flujo de despliegue. Staging compila y despliega la imagen después de superar Checks activados por push; `main` promueve el digest exacto probado tras superar Checks. Comprueba en GitHub las reglas de ramas, CodeQL, Dependabot y la visibilidad del paquete. GHCR debe ser legible por el mini PC: publica el paquete o instala en el host una credencial de lectura del registro propiedad de root.

Configura entornos de Actions llamados `staging` y `production`. Cada trabajo de despliegue necesita los secretos de entorno cifrados `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY` y `DEPLOY_KNOWN_HOSTS`; define esos nombres y valores adecuados en ambos entornos porque cada trabajo utiliza su propio ámbito. Ambos necesitan `DEPLOY_TARGET` (la cuenta SSH restringida y el nombre tailnet del mini PC); solo staging usa `STAGING_URL` (la URL HTTPS del servicio privado). Conserva los valores en los ajustes de GitHub y no los copies a la documentación. El cliente OAuth de Tailscale debe emitir dispositivos efímeros con la etiqueta `tag:ci`, y los permisos tailnet deben limitarla a SSH en el host de despliegue y HTTPS en el servicio staging. Si se desea una puerta de aprobación, configura revisores obligatorios y ramas permitidas en el entorno `production`; el flujo hace referencia a ese entorno, pero la declaración no exige revisión por sí sola. Comprueba los ajustes en **Settings → Environments** y en una ejecución real.

Configura la cuenta SSH del servidor con el comando forzado `/usr/local/sbin/pokemon-deploy-ssh`, sin PTY ni reenvío de puertos, y con sudo limitado a `/usr/local/sbin/pokemon-deploy` y comandos validados. El script de despliegue propiedad de root solo acepta digests sha256 de GHCR y SHA completos de Git. El flujo de staging compila una vez, despliega por digest, ejecuta pruebas de humo de salud, catálogo, equipos profesionales, OpenAPI y daño a través del servicio privado, y registra el commit, árbol y digest probados. Si falla una prueba privada, CI invoca `stage-abort` para restaurar la imagen de aplicación anterior; las migraciones persisten y deben ser compatibles hacia atrás. Tras superar Checks en `main`, producción confirma que el SHA sigue en la cabecera de `main`, compara su árbol de Git con el de staging y despliega ese mismo digest sin recompilar. Usa el entorno `production`. Solo hay una puerta de revisión si está configurada en sus ajustes; el YAML no la exige. La persona propietaria informa de que ambos flujos terminaron y producción está activa; conserva las ejecuciones de Actions como prueba.

Para una reversión solicitada, una persona administradora ejecuta `sudo /usr/local/sbin/pokemon-deploy rollback production` o `rollback staging`. Solo recrea el servicio de aplicación con la imagen satisfactoria anterior. No revierte datos. Cada migración publicada debe ser compatible con la imagen inmediatamente anterior.

## 4. Puerta de copias y restauración USB

Monta la unidad USB en una ruta estable, por ejemplo `/mnt/pokemon-backup`, y copia [`infra/secrets/backup.env.example`](../infra/secrets/backup.env.example) como `infra/secrets/backup.env`, propiedad de root y con permisos `0600`. Define `USB_MOUNT`, `RESTIC_REPOSITORY` bajo ese montaje y `RESTIC_PASSWORD_FILE` con la ruta a un archivo de contraseña solo accesible para root. La ruta del repositorio se puede cambiar más adelante para trasladarlo o guardar una copia remota. Instala y habilita `infra/systemd/pokemon-backup.timer`; ajusta `RequiresMountsFor` si cambia el montaje. El script se detiene si falta la unidad USB; no escribe silenciosamente en el sistema de archivos raíz. Crea una instantánea restic cifrada a diario y antes de las migraciones de producción. Guarda la contraseña restic separada del USB.

Cuando staging tenga datos, ejecuta una copia de staging y después `sudo /usr/local/sbin/pokemon-restore-drill staging`. El comando restaura la instantánea más reciente en una base de datos desechable, consulta una tabla, elimina la base y escribe el marcador de restauración USB. Una restauración satisfactoria desde el USB conectado solo demuestra recuperación local. Mantén una copia fuera del host como mejora futura.

Antes de la primera promoción de producción, prueba la entrada pública desde fuera de la red doméstica y ejecuta la prueba de restauración desechable; el script del host comprueba los marcadores `public-ingress.passed` y `usb-restore.passed`, además del árbol de staging probado. Se informa de que la publicación de producción ya tuvo éxito. Vuelve a probar la entrada y la restauración después de cambios importantes en red o almacenamiento de copias. Un marcador registra una comprobación completada; no la sustituye.

## 5. Límites de la verificación desde la estación de trabajo

La estación Windows no ejecuta el daemon Docker ni PostgreSQL del mini PC; las operaciones del host se hicieron por separado mediante SSH. Según la persona propietaria, los flujos de staging y producción terminaron y la página está activa. Las comprobaciones de humo de CI cubren algunos endpoints de API de staging, no todo el comportamiento del producto. Siguen pendientes las pruebas de suplantación de cabeceras del proxy, entrega de correo, recorridos de cuenta y acceso entre cuentas con base de datos, recorridos completos de Playwright, acceso a Funnel (opcional) y comportamiento de reversión. El [registro del despliegue de staging a producción](tfm/ai-methodology/workflows/006-staging-production-rollout.es.md) explica lo conocido y lo que sigue sin confirmarse.
