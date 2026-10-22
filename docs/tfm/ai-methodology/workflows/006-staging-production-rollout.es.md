[![English](https://img.shields.io/badge/lang-en-red.svg)](006-staging-production-rollout.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](006-staging-production-rollout.es.md)

# Publicación en staging y producción

> Estado: Registrado a partir de la configuración del repositorio y los informes de la persona propietaria del 2026-09-30. No se reconstruyen detalles de ejecución de los flujos que no estén respaldados por las pruebas proporcionadas; los registros de GitHub Actions son la fuente de referencia.

## Propósito y motivo

Después de preparar el host y configurar CI para el despliegue, la persona propietaria solicitó promover a producción la plantilla de staging y publicarla en la dirección DuckDNS. Más tarde informó de que producción funcionaba y de que la página estaba disponible. Este registro describe la ruta de publicación y la configuración operativa del TFM. No es una transcripción completa, una auditoría independiente de producción ni una prueba de que se hayan superado todos los criterios de aceptación de la aplicación.

## Entradas y funciones

- **Persona propietaria:** preparó el mini PC, la política de red de Tailscale, los valores de entornos de GitHub, la configuración y los secretos del host; ejecutó comandos, revisó resultados e informó de que los flujos de staging y producción habían terminado correctamente y el sitio era público.
- **Codex:** inspeccionó los flujos de Actions y los scripts de despliegue del repositorio, guio la configuración del host y GitHub, diagnosticó problemas de red entre Caddy y Docker y de DNS a partir de salidas de comandos compartidas, y actualizó la documentación según el resultado comunicado.
- **Pruebas del repositorio:** los archivos [`staging.yml`](../../../../.github/workflows/staging.yml), [`production.yml`](../../../../.github/workflows/production.yml), [`deploy.sh`](../../../../infra/scripts/deploy.sh), [`deploy-ssh.sh`](../../../../infra/scripts/deploy-ssh.sh) y los archivos de Compose y Caddy definen la automatización. La salida de terminal compartida en la conversación demuestra pasos individuales en el host; los registros más recientes de GitHub siguen siendo la fuente para conocer identificadores exactos de ejecuciones, SHA y conclusiones.

## Preparación del host y depuración registrada

El mini PC ejecuta Ubuntu 24.04.4, Docker Compose 5.1.1 y Tailscale 1.102.4. La copia del repositorio revisada por la persona administradora está en `/opt/pokemon-tools`; los scripts privilegiados de despliegue, envoltorio SSH, copia de seguridad y prueba de restauración se instalaron en `/usr/local/sbin`. El estado de despliegue, accesible solo por root, y los archivos de entorno en ejecución propiedad de root se conservan en el host. Caddy se ejecuta con UID/GID `1003:1003` para satisfacer las necesidades de propiedad de archivos de la cuenta `utilities`.

El host tiene servicios PostgreSQL separados para staging y producción, Caddy compartido y redes de borde exclusivas para las aplicaciones. Caddy publica los puertos públicos 80/443 y los puertos de traspaso de Tailscale limitados a loopback 18081/18082. Cuando staging devolvió inicialmente un error 502, los registros de la API mostraron que el DNS integrado de Docker no podía resolver el servicio de API recreado. La persona propietaria actualizó la configuración del resolvedor de Docker tras restaurar la resolución DNS del host y conectó Caddy a la red de borde de staging declarada en Compose. Después confirmó que el despliegue de staging funcionaba. Este historial es contexto operativo útil; no implica que vaya a repetirse el mismo problema DNS.

La persona propietaria configuró `svc:pokemon-staging` para servir HTTPS en el puerto 443 y dirigirlo a Caddy en `127.0.0.1:18081`. La ACL inicial de tailnet permitía todo el tráfico; se sustituyó por permisos para administradores y `tag:ci` que permiten acceder por SSH al host y al servicio de staging por TCP 443. La persona propietaria indicó que siguió funcionando. La ruta pública de producción es DuckDNS con HTTPS → Caddy → API de producción. Funnel en 8443 sigue siendo una alternativa opcional y no se informó de que estuviera habilitada.

La unidad USB está montada en `/mnt/pokemon-backup`; se inicializó y verificó un repositorio restic cifrado. La persona propietaria ejecutó una copia de seguridad de staging y la prueba de restauración desechable; se restauró la instantánea sin errores comunicados. Es recuperación local en almacenamiento conectado al mismo host, no una copia externa.

## Configuración y comportamiento de CI/CD

Los entornos de GitHub `staging` y `production` proporcionan la configuración de despliegue. Ambos trabajos de despliegue leen los secretos cifrados `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY` y `DEPLOY_KNOWN_HOSTS`. Ambos leen `DEPLOY_TARGET`; staging también lee `STAGING_URL`. Este registro omite deliberadamente los valores. La persona propietaria indicó que los cuatro secretos se habían creado en el entorno de producción; staging necesita sus propias copias de ámbito de entorno. Comprueba cada ámbito y variable en GitHub, en **Settings → Environments**.

Los flujos se ejecutan tras superar las comprobaciones `Checks` activadas por un push en sus ramas respectivas:

1. El flujo de staging comprueba que el SHA que lo inició siga siendo la cabecera de `staging`, compila y publica una imagen de contenedor en GHCR, se conecta a tailnet con la identidad `tag:ci` y solicita a la cuenta SSH de comando restringido que despliegue el digest inmutable.
2. Staging aplica migraciones y comprueba la salud, el catálogo, los datos de equipos profesionales, OpenAPI generado y una petición de daño mediante la URL privada de staging. Si todo sale bien, el host registra el commit probado, el árbol de Git y el digest de la imagen. Si falla una comprobación, `stage-abort` restaura la imagen anterior de la aplicación; no revierte las migraciones.
3. El flujo de producción se ejecuta tras superar `Checks` en `main`, confirma que el SHA que lo inició siga siendo la cabecera de `main`, se conecta al host con la cuenta SSH restringida, compara el árbol de Git de `main` con el árbol registrado por staging y despliega el digest registrado. No compila una segunda imagen.
4. Ambos flujos usan entornos de GitHub. Solo hay una pausa por revisión obligatoria cuando se activa una regla de revisores en la configuración del entorno; la referencia YAML a `production` por sí sola no exige aprobación. La persona propietaria quería una puerta de aprobación en producción, pero las pruebas disponibles para este registro no muestran los revisores finales ni las reglas de ramas.

La persona propietaria informó de que las ejecuciones de staging y producción terminaron correctamente y de que la página de producción estaba activa en [`https://jcrserver.duckdns.org`](https://jcrserver.duckdns.org). Esto respalda que el despliegue y el acceso funcionaban en el momento informado. No acredita el SHA exacto de publicación, los identificadores de ejecución de Actions, la regla de revisión configurada, el comportamiento completo del navegador ni todas las comprobaciones de aceptación de seguridad. Conserva las páginas de las ejecuciones de Actions correspondientes como pruebas principales.

## Cambios en la documentación

El [README raíz](../../../../README.es.md), la [guía de operaciones](../../../operations.es.md) y el [plan de infraestructura](../../../infrastructure/infrastructure-plan.es.md) se actualizaron para reflejar el informe de producción activa, la promoción por digest de staging a producción, la configuración del entorno de GitHub, la resolución de problemas DNS y de red del host, las pruebas de copia/restauración y las verificaciones pendientes. No se copiaron valores secretos al repositorio. Los registros anteriores conservan sus fechas y hallazgos históricos; no se reescriben como si describieran el estado actual de entonces.

## Verificaciones pendientes

- Confirmar directamente en la configuración de GitHub los secretos y variables de los entornos `staging` y `production`, los revisores obligatorios de producción, las ramas autorizadas y las protecciones del repositorio.
- Guardar enlaces o identificadores de las ejecuciones satisfactorias de Checks, despliegue de staging y promoción de producción; registrar el digest de imagen y el árbol Git publicado si se necesitan como pruebas finales del TFM.
- Probar la entrada directa y por Tailscale con cabeceras de reenvío falsificadas, verificar la pertenencia de hosts a la red y la ausencia de puertos de host para API o base de datos, e inspeccionar las cabeceras de seguridad y cookies desplegadas.
- Ejecutar recorridos completos con Playwright, pruebas de cuentas con base de datos y entre cuentas, flujos de correo si SMTP está habilitado y una prueba de reversión de la aplicación sin modificar la base de datos.
- Mantener las copias externas y Funnel como tareas posteriores opcionales explícitas, salvo que la persona propietaria decida configurarlas.

## Límites y revisión humana

Este registro se basa en el éxito del despliegue comunicado por la persona propietaria cuando no se pegó en la tarea la salida exacta de la ejecución. No afirma que una respuesta vacía o negra del endpoint de salud sea la interfaz del producto: `/api/health` es una ruta de API, mientras que la URL raíz pública sirve la página web. Que la página pública funcione es una comprobación de despliegue significativa, pero no equivale a la aceptación del producto, una auditoría de seguridad o alta disponibilidad. La persona propietaria debe corregir cualquier detalle operativo que difiera del host o de la configuración real de GitHub.
