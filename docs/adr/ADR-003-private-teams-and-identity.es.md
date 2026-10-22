[![English](https://img.shields.io/badge/lang-en-red.svg)](ADR-003-private-teams-and-identity.md) [![Español](https://img.shields.io/badge/lang-es-yellow.svg)](ADR-003-private-teams-and-identity.es.md)

# ADR-003: Guardar equipos privados con PostgreSQL, Prisma 7 y Better Auth

- **Fecha:** 2026-09-27
- **Estado:** Aceptada

## Contexto y restricciones

Los invitados pueden comparar equipos temporales en un navegador, mientras que quienes tienen cuenta necesitan equipos privados que perduren más allá de una sesión. El proyecto también pretende practicar backend, API, migraciones y autenticación. Staging y producción necesitan bases de datos y secretos de ejecución distintos.

## Alternativas consideradas

- **Almacenamiento del navegador para todos los equipos:** basta para borradores temporales, pero no ofrece almacenamiento en servidor propiedad de una cuenta ni un límite de autorización útil.
- **Una base de datos más sencilla o SQL y migraciones escritos a mano:** sería viable a esta escala, pero cambiaría el objetivo educativo elegido de PostgreSQL y aumentaría el código de persistencia que debe mantener el proyecto.
- **Autenticación propia:** ofrecería control completo, pero dejaría el comportamiento de credenciales y sesiones en el código del proyecto, en vez de una biblioteca de autenticación específica.

## Decisión y motivos

Los borradores de invitados permanecerán en el almacenamiento del navegador. Los equipos propiedad de una cuenta se guardarán en PostgreSQL 18 mediante un adaptador de Prisma 7. Se fijará la versión principal 7 de Prisma mientras Prisma 8 siga pendiente de revisión. Se utilizará Better Auth para cuentas y sesiones por correo y contraseña, con su adaptador de Prisma. Las operaciones de equipos privados se autorizarán mediante la sesión, y las consultas de persistencia filtrarán las lecturas y eliminaciones por la persona propietaria autenticada. La URL de la base de datos, el secreto de autenticación, la URL base y los orígenes de confianza estarán en la configuración de ejecución de cada entorno.

La verificación del correo en la primera versión pública sigue siendo una cuestión abierta de requisitos. La implementación actual la activa cuando SMTP está configurado; este ADR no decide la política de publicación.

## Consecuencias

- El almacenamiento en servidor permite equipos privados y datos independientes para staging y producción. También exige proteger, migrar, respaldar y restaurar esos datos.
- Better Auth reduce el código propio para credenciales y sesiones, pero vincula el proyecto a su configuración e integración de esquemas.
- Prisma facilita el acceso tipado a los datos, pero la compatibilidad del cliente generado y las migraciones pasa a afectar a la compilación y las publicaciones.
- Los borradores del navegador permanecen en ese navegador hasta que la persona usuaria elija un flujo para guardarlos.

## Pruebas y fuentes

- Decisión del proyecto: [requisitos REQ-005, REQ-006, REQ-011 y REQ-013](../requirements/requirements.es.md) y [mapa vivo de arquitectura](../architecture/architecture.es.md).
- Pruebas de implementación: [esquema Prisma](../../apps/api/prisma/schema.prisma), [almacén de equipos](../../apps/api/src/modules/teams/prisma-adapter.ts), [configuración de autenticación](../../apps/api/src/modules/auth/auth.ts) y [versiones de dependencias de la API](../../apps/api/package.json).
- Influencia del curso: la lección validada **Aplicando Clean Architecture con TypeScript → Puertos y adaptadores** informa del límite de persistencia. PostgreSQL, Prisma y Better Auth son decisiones aprobadas por la persona propietaria, no prescripciones del curso.
