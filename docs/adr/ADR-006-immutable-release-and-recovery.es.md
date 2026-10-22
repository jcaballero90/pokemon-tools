[![English](https://img.shields.io/badge/lang-en-red.svg)](ADR-006-immutable-release-and-recovery.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](ADR-006-immutable-release-and-recovery.es.md)

# ADR-006: Promover un digest probado con puertas explícitas de recuperación

- **Fecha:** 2026-09-27
- **Estado:** Aceptada

## Contexto y restricciones

El proyecto necesita una ruta de publicación escalonada desde el trabajo local hasta una versión pública en un mini PC. Producción debe usar el artefacto que ya se probó en staging. Una publicación fallida necesita una reversión práctica y los datos privados de PostgreSQL requieren copias recuperables. El dispositivo disponible es una unidad USB conectada al mini PC; todavía no existe un NAS ni un repositorio externo.

## Alternativas consideradas

- **Volver a compilar `main` para producción:** produciría un artefacto nuevo incluso con el mismo árbol de código y debilitaría el vínculo con las pruebas de staging.
- **Desplegar etiquetas mutables:** son cómodas de escribir, pero una etiqueta puede apuntar más adelante a otro contenido de imagen.
- **Confiar en la reversión de imagen para todos los fallos:** restaura el código de aplicación, pero no puede revertir una migración ni recuperar datos perdidos.
- **Usar copias locales sin probar la restauración:** crea instantáneas, pero no demuestra que se puedan restaurar.

## Decisión y motivos

Cuando se superen las comprobaciones en `staging`, se compilará y publicará una imagen de GHCR, se desplegará mediante digest inmutable, se probará por la ruta privada de staging y se registrarán el commit, el árbol Git y el digest. El flujo protegido de `main` deberá coincidir con ese árbol probado. Tras la aprobación de producción, se desplegará el digest registrado sin volver a compilar. Se conservará el último digest satisfactorio para que una publicación fallida o una reversión solicitada pueda recrear solo el servicio de aplicación. Las migraciones deben ser compatibles con la imagen inmediatamente anterior, porque la reversión no deshace los cambios de base de datos.

Se harán copias diarias de PostgreSQL y otra antes de cada migración de producción en un repositorio restic cifrado de la unidad USB montada. Se exigirá restaurar de verdad en una base de datos desechable y comprobar que la entrada pública funciona antes de la primera publicación de producción. El destino de las copias podrá configurarse más adelante para añadir una copia externa. Los scripts del host implementan actualmente comprobaciones mediante marcadores; el personal administrador solo debe crear el marcador de entrada pública después de realizar una prueba externa.

## Consecuencias

- El artefacto publicado se puede relacionar con el árbol y las comprobaciones de staging, y la reversión de la aplicación se ejecuta rápidamente.
- Las migraciones deben ser compatibles con la versión anterior. Un fallo de datos o migración aún puede exigir un procedimiento de recuperación aparte.
- El repositorio USB permite recuperarse de algunos fallos locales, pero se expone a la pérdida de la ubicación del mini PC hasta que exista una copia externa.
- **Estado de implementación (2026-09-30):** la persona propietaria informa de ejecuciones satisfactorias de staging y producción, una prueba de restauración de staging completada y una página pública de producción activa. Se deben conservar los enlaces de Actions para acreditar el commit y el digest exactos. Aún hay que verificar la configuración de revisores, la recuperación de staging fallido y la reversión exclusiva de la aplicación.

## Pruebas y fuentes

- Decisión del proyecto: [requisitos REQ-014, REQ-015 y REQ-016](../requirements/requirements.es.md) y [guía de operaciones](../operations.es.md).
- Pruebas de implementación: [flujo de staging](../../.github/workflows/staging.yml), [flujo de producción](../../.github/workflows/production.yml), [script de despliegue](../../infra/scripts/deploy.sh), [script de copia de seguridad](../../infra/scripts/backup.sh) y [prueba de restauración](../../infra/scripts/restore-drill.sh).
- Influencia del curso: la lección validada **Calidad → Documentación con IA → ADRs** orienta el registro de alternativas y consecuencias. La promoción por digest, las reversiones y las puertas USB son decisiones aprobadas para el proyecto.
